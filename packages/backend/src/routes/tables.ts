/**
 * Table Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import type { CreateTableRequest, CreateTableResponse, GetTablesResponse } from '@poker-logger/shared';
import { GameType } from '@poker-logger/shared';

const tableRoutes: FastifyPluginAsync = async (fastify) => {
  // Create table schema
  const createTableSchema = z.object({
    name: z.string().min(3).max(100),
    gameType: z.nativeEnum(GameType),
    smallBlind: z.number().positive(),
    bigBlind: z.number().positive(),
    maxPlayers: z.number().int().min(2).max(10)
  });

  // GET /api/tables - Get all tables
  fastify.get<{ Reply: GetTablesResponse }>('/', async (request, reply) => {
    try {
      const tables = await prisma.table.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: tables.map(table => ({
          ...table,
          smallBlind: Number(table.smallBlind),
          bigBlind: Number(table.bigBlind)
        }))
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '테이블 목록을 불러오는데 실패했습니다.'
      });
    }
  });

  // GET /api/tables/:id - Get table by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const table = await prisma.table.findUnique({
        where: { id: request.params.id },
        include: {
          hands: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!table) {
        return reply.status(404).send({
          success: false,
          error: '테이블을 찾을 수 없습니다.'
        });
      }

      return {
        success: true,
        data: {
          ...table,
          smallBlind: Number(table.smallBlind),
          bigBlind: Number(table.bigBlind),
          hands: table.hands.map(hand => ({
            ...hand,
            pot: Number(hand.pot),
            rake: Number(hand.rake)
          }))
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '테이블 정보를 불러오는데 실패했습니다.'
      });
    }
  });

  // POST /api/tables - Create new table
  fastify.post<{
    Body: CreateTableRequest;
    Reply: CreateTableResponse;
  }>('/', async (request, reply) => {
    try {
      // Validate request body
      const validatedData = createTableSchema.parse(request.body);

      // Create table
      const table = await prisma.table.create({
        data: {
          name: validatedData.name,
          gameType: validatedData.gameType,
          smallBlind: validatedData.smallBlind,
          bigBlind: validatedData.bigBlind,
          maxPlayers: validatedData.maxPlayers
        }
      });

      return reply.status(201).send({
        success: true,
        data: {
          ...table,
          smallBlind: Number(table.smallBlind),
          bigBlind: Number(table.bigBlind)
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
        return reply.status(409).send({
          success: false,
          error: '이미 존재하는 테이블 이름입니다.'
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '테이블 생성에 실패했습니다.'
      });
    }
  });

  // DELETE /api/tables/:id - Delete table
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      await prisma.table.delete({
        where: { id: request.params.id }
      });

      return {
        success: true
      };
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: '테이블을 찾을 수 없습니다.'
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: '테이블 삭제에 실패했습니다.'
      });
    }
  });
};

export default tableRoutes;
