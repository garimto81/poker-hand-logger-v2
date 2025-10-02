/**
 * Hand Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import type {
  CreateHandRequest,
  CreateHandResponse,
  AddActionRequest,
  AddActionResponse,
  GetHandDetailsResponse
} from '@poker-logger/shared';
import { Street, ActionType, Position } from '@poker-logger/shared';
import { getSocketService } from '../services/socket';

const handRoutes: FastifyPluginAsync = async (fastify) => {
  // Create hand schema
  const createHandSchema = z.object({
    tableId: z.string().cuid(),
    handNumber: z.number().int().positive(),
    players: z.array(
      z.object({
        playerId: z.string().cuid(),
        position: z.nativeEnum(Position),
        startingChips: z.number().positive(),
        cards: z.array(z.string()).length(2).optional()
      })
    ).min(2).max(10)
  });

  // Add action schema
  const addActionSchema = z.object({
    handId: z.string().cuid(),
    playerId: z.string().cuid(),
    street: z.nativeEnum(Street),
    actionType: z.nativeEnum(ActionType),
    amount: z.number().min(0)
  });

  // GET /api/hands/:id - Get hand details
  fastify.get<{
    Params: { id: string };
    Reply: GetHandDetailsResponse;
  }>('/:id', async (request, reply) => {
    try {
      const hand = await prisma.hand.findUnique({
        where: { id: request.params.id },
        include: {
          table: true,
          players: {
            include: { player: true },
            orderBy: { position: 'asc' }
          },
          actions: {
            include: { player: true },
            orderBy: { sequence: 'asc' }
          }
        }
      });

      if (!hand) {
        return reply.status(404).send({
          success: false,
          error: '핸드를 찾을 수 없습니다.'
        });
      }

      return {
        success: true,
        data: {
          hand: {
            ...hand,
            pot: Number(hand.pot),
            rake: Number(hand.rake)
          },
          players: hand.players.map(p => ({
            ...p,
            startingChips: Number(p.startingChips),
            endingChips: Number(p.endingChips),
            won: Number(p.won),
            player: {
              ...p.player,
              totalWinnings: Number(p.player.totalWinnings)
            }
          })),
          actions: hand.actions.map(a => ({
            ...a,
            amount: Number(a.amount),
            player: {
              ...a.player,
              totalWinnings: Number(a.player.totalWinnings)
            }
          }))
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '핸드 정보를 불러오는데 실패했습니다.'
      });
    }
  });

  // POST /api/hands - Create new hand
  fastify.post<{
    Body: CreateHandRequest;
    Reply: CreateHandResponse;
  }>('/', async (request, reply) => {
    try {
      // Validate request body
      const validatedData = createHandSchema.parse(request.body);

      // Verify table exists
      const table = await prisma.table.findUnique({
        where: { id: validatedData.tableId }
      });

      if (!table) {
        return reply.status(404).send({
          success: false,
          error: '테이블을 찾을 수 없습니다.'
        });
      }

      // Verify all players exist
      const playerIds = validatedData.players.map(p => p.playerId);
      const players = await prisma.player.findMany({
        where: { id: { in: playerIds } }
      });

      if (players.length !== playerIds.length) {
        return reply.status(404).send({
          success: false,
          error: '일부 플레이어를 찾을 수 없습니다.'
        });
      }

      // Create hand with players
      const hand = await prisma.hand.create({
        data: {
          tableId: validatedData.tableId,
          handNumber: validatedData.handNumber,
          street: Street.PREFLOP,
          pot: 0,
          rake: 0,
          players: {
            create: validatedData.players.map(p => ({
              playerId: p.playerId,
              position: p.position,
              startingChips: p.startingChips,
              endingChips: p.startingChips, // Initially same as starting
              cards: p.cards ? JSON.stringify(p.cards) : null,
              won: 0,
              showedDown: false
            }))
          }
        },
        include: {
          players: {
            include: { player: true }
          }
        }
      });

      // Broadcast WebSocket event
      try {
        const socketService = getSocketService();
        socketService.broadcastHandCreated(validatedData.tableId, hand);
      } catch (err) {
        fastify.log.warn('WebSocket broadcast failed:', err);
      }

      return reply.status(201).send({
        success: true,
        data: {
          ...hand,
          pot: Number(hand.pot),
          rake: Number(hand.rake)
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '입력 데이터가 올바르지 않습니다.',
          validationErrors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      // Check for unique constraint violation (same hand number)
      if ((error as any).code === 'P2002') {
        return reply.status(409).send({
          success: false,
          error: '이미 존재하는 핸드 번호입니다.'
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '핸드 생성에 실패했습니다.'
      });
    }
  });

  // POST /api/hands/:id/actions - Add action to hand
  fastify.post<{
    Params: { id: string };
    Body: Omit<AddActionRequest, 'handId'>;
    Reply: AddActionResponse;
  }>('/:id/actions', async (request, reply) => {
    try {
      const handId = request.params.id;

      // Validate request body
      const validatedData = addActionSchema.parse({
        ...request.body,
        handId
      });

      // Verify hand exists
      const hand = await prisma.hand.findUnique({
        where: { id: handId },
        include: { actions: true }
      });

      if (!hand) {
        return reply.status(404).send({
          success: false,
          error: '핸드를 찾을 수 없습니다.'
        });
      }

      // Calculate next sequence number
      const nextSequence = hand.actions.length > 0
        ? Math.max(...hand.actions.map(a => a.sequence)) + 1
        : 1;

      // Create action
      const action = await prisma.action.create({
        data: {
          handId: validatedData.handId,
          playerId: validatedData.playerId,
          street: validatedData.street,
          actionType: validatedData.actionType,
          amount: validatedData.amount,
          sequence: nextSequence
        }
      });

      // Update pot if action involves money
      if ([ActionType.BET, ActionType.RAISE, ActionType.CALL, ActionType.ALL_IN].includes(validatedData.actionType)) {
        await prisma.hand.update({
          where: { id: handId },
          data: {
            pot: {
              increment: validatedData.amount
            }
          }
        });
      }

      return reply.status(201).send({
        success: true,
        data: {
          ...action,
          amount: Number(action.amount)
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '입력 데이터가 올바르지 않습니다.',
          validationErrors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '액션 추가에 실패했습니다.'
      });
    }
  });

  // PATCH /api/hands/:id/complete - Complete hand and calculate winners
  fastify.patch<{ Params: { id: string } }>('/:id/complete', async (request, reply) => {
    try {
      const hand = await prisma.hand.findUnique({
        where: { id: request.params.id },
        include: {
          table: true,
          players: true
        }
      });

      if (!hand) {
        return reply.status(404).send({
          success: false,
          error: '핸드를 찾을 수 없습니다.'
        });
      }

      // Calculate rake (5% of pot, max 10)
      const rakePercentage = 0.05;
      const maxRake = 10;
      const pot = Number(hand.pot);
      const rake = Math.min(pot * rakePercentage, maxRake);
      const potAfterRake = pot - rake;

      // Update hand status
      await prisma.hand.update({
        where: { id: request.params.id },
        data: {
          street: Street.SHOWDOWN,
          rake
        }
      });

      return {
        success: true,
        data: {
          handId: hand.id,
          pot,
          rake,
          potAfterRake
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '핸드 완료 처리에 실패했습니다.'
      });
    }
  });
};

export default handRoutes;
