/**
 * Backend Configuration
 */

import dotenv from 'dotenv';
import { LOG_LEVELS } from '@poker-logger/shared';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://poker:poker123@localhost:5432/poker_hand_logger',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Logging
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Rate Limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000', 10)
  },

  // WebSocket
  ws: {
    path: process.env.WS_PATH || '/ws'
  }
} as const;

export default config;
