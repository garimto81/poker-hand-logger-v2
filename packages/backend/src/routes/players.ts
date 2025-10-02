/**
 * Player Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import type { CreatePlayerRequest, CreatePlayerResponse, GetPlayersResponse } from '@poker-logger/shared';

const playerRoutes: FastifyPluginAsync = async (fastify) => {
  // Create player schema
  const createPlayerSchema = z.object({
    name: z.string().min(2).max(50),
    email: z.string().email().optional()
  });

  // GET /api/players - Get all players
  fastify.get<{ Reply: GetPlayersResponse }>('/', async (request, reply) => {
    try {
      const players = await prisma.player.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: players.map(player => ({
          ...player,
          totalWinnings: Number(player.totalWinnings)
        }))
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '플레이어 목록을 불러오는데 실패했습니다.'
      });
    }
  });

  // GET /api/players/:id - Get player by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const player = await prisma.player.findUnique({
        where: { id: request.params.id },
        include: {
          playerInHands: {
            take: 20,
            orderBy: { hand: { createdAt: 'desc' } },
            include: {
              hand: {
                include: {
                  table: true
                }
              }
            }
          }
        }
      });

      if (!player) {
        return reply.status(404).send({
          success: false,
          error: '플레이어를 찾을 수 없습니다.'
        });
      }

      return {
        success: true,
        data: {
          ...player,
          totalWinnings: Number(player.totalWinnings),
          playerInHands: player.playerInHands.map(pih => ({
            ...pih,
            startingChips: Number(pih.startingChips),
            endingChips: Number(pih.endingChips),
            won: Number(pih.won),
            hand: {
              ...pih.hand,
              pot: Number(pih.hand.pot),
              rake: Number(pih.hand.rake),
              table: {
                ...pih.hand.table,
                smallBlind: Number(pih.hand.table.smallBlind),
                bigBlind: Number(pih.hand.table.bigBlind)
              }
            }
          }))
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '플레이어 정보를 불러오는데 실패했습니다.'
      });
    }
  });

  // POST /api/players - Create new player
  fastify.post<{
    Body: CreatePlayerRequest;
    Reply: CreatePlayerResponse;
  }>('/', async (request, reply) => {
    try {
      // Validate request body
      const validatedData = createPlayerSchema.parse(request.body);

      // Create player
      const player = await prisma.player.create({
        data: {
          name: validatedData.name,
          email: validatedData.email
        }
      });

      return reply.status(201).send({
        success: true,
        data: {
          ...player,
          totalWinnings: Number(player.totalWinnings)
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

      // Check for unique constraint violation
      if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target?.[0];
        return reply.status(409).send({
          success: false,
          error: target === 'email'
            ? '이미 등록된 이메일입니다.'
            : '이미 존재하는 플레이어 이름입니다.'
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '플레이어 생성에 실패했습니다.'
      });
    }
  });

  // GET /api/players/:id/stats - Get player statistics
  fastify.get<{ Params: { id: string } }>('/:id/stats', async (request, reply) => {
    try {
      const player = await prisma.player.findUnique({
        where: { id: request.params.id },
        include: {
          playerInHands: {
            select: {
              won: true,
              startingChips: true,
              endingChips: true,
              showedDown: true
            }
          }
        }
      });

      if (!player) {
        return reply.status(404).send({
          success: false,
          error: '플레이어를 찾을 수 없습니다.'
        });
      }

      // Calculate statistics
      const totalHands = player.playerInHands.length;
      const totalWon = player.playerInHands.reduce((sum, h) => sum + Number(h.won), 0);
      const totalProfit = player.playerInHands.reduce(
        (sum, h) => sum + (Number(h.endingChips) - Number(h.startingChips)),
        0
      );
      const handsWon = player.playerInHands.filter(h => Number(h.won) > 0).length;
      const showdownsWon = player.playerInHands.filter(h => h.showedDown && Number(h.won) > 0).length;
      const totalShowdowns = player.playerInHands.filter(h => h.showedDown).length;

      return {
        success: true,
        data: {
          playerId: player.id,
          playerName: player.name,
          totalHands,
          totalWon,
          totalProfit,
          handsWon,
          winRate: totalHands > 0 ? (handsWon / totalHands) * 100 : 0,
          showdownWinRate: totalShowdowns > 0 ? (showdownsWon / totalShowdowns) * 100 : 0,
          avgProfitPerHand: totalHands > 0 ? totalProfit / totalHands : 0
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '플레이어 통계를 불러오는데 실패했습니다.'
      });
    }
  });
};

export default playerRoutes;
