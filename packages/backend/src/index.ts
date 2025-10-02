/**
 * 포커 핸드 로거 v2.0 - Backend Server with WebSocket
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import config from './config';
import tableRoutes from './routes/tables';
import playerRoutes from './routes/players';
import handRoutes from './routes/hands';
import { initializeSocketService } from './services/socket';

// Initialize Prisma
export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error']
});

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport: config.isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
      : undefined
  }
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: config.isDevelopment ? false : undefined
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow
  });
}

// Register routes
async function registerRoutes() {
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.register(tableRoutes, { prefix: '/api/tables' });
  fastify.register(playerRoutes, { prefix: '/api/players' });
  fastify.register(handRoutes, { prefix: '/api/hands' });
}

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    fastify.log.info('✅ Database connected');

    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start listening
    await fastify.listen({ port: config.port, host: '0.0.0.0' });

    // Initialize WebSocket after HTTP server is ready
    const socketService = initializeSocketService(fastify.server);
    fastify.log.info('🔌 WebSocket server initialized');
    fastify.log.info(`   Socket.io path: /socket.io`);

    fastify.log.info(`🚀 Server running on http://localhost:${config.port}`);
    fastify.log.info(`📊 Environment: ${config.nodeEnv}`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  fastify.log.info('🛑 Shutting down gracefully...');

  try {
    await fastify.close();
    await prisma.$disconnect();
    fastify.log.info('✅ Server closed');
    process.exit(0);
  } catch (err) {
    fastify.log.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
start();

export default fastify;
