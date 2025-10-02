/**
 * 포커 핸드 로거 v2.0 - 공유 상수
 */

// ========================================
// API Configuration
// ========================================

export const API_CONFIG = {
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// ========================================
// Poker Rules
// ========================================

export const POKER_RULES = {
  MAX_PLAYERS_PER_TABLE: 10,
  MIN_PLAYERS_PER_TABLE: 2,
  CARDS_PER_PLAYER: 2,
  FLOP_CARDS: 3,
  TURN_CARDS: 1,
  RIVER_CARDS: 1,
  TOTAL_COMMUNITY_CARDS: 5
} as const;

// ========================================
// Position Order (for 10-handed table)
// ========================================

export const POSITION_ORDER = [
  'SB',
  'BB',
  'UTG',
  'UTG+1',
  'UTG+2',
  'MP',
  'MP+1',
  'HJ',
  'CO',
  'BTN'
] as const;

export const FULL_RING_POSITIONS = [
  { position: 'SB', seat: 1, displayName: 'Small Blind' },
  { position: 'BB', seat: 2, displayName: 'Big Blind' },
  { position: 'UTG', seat: 3, displayName: 'Under the Gun' },
  { position: 'UTG+1', seat: 4, displayName: 'UTG+1' },
  { position: 'UTG+2', seat: 5, displayName: 'UTG+2' },
  { position: 'MP', seat: 6, displayName: 'Middle Position' },
  { position: 'MP+1', seat: 7, displayName: 'MP+1' },
  { position: 'HJ', seat: 8, displayName: 'Hijack' },
  { position: 'CO', seat: 9, displayName: 'Cutoff' },
  { position: 'BTN', seat: 10, displayName: 'Button' }
] as const;

// ========================================
// Validation Rules
// ========================================

export const VALIDATION = {
  PLAYER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9가-힣_\-\s]+$/
  },
  TABLE_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9가-힣_\-\s]+$/
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  CHIPS: {
    MIN: 0,
    MAX: 1000000000 // 10억
  },
  BLINDS: {
    MIN: 1,
    MAX: 1000000
  }
} as const;

// ========================================
// Cache Configuration
// ========================================

export const CACHE_CONFIG = {
  TTL: {
    TABLES: 5 * 60 * 1000, // 5 minutes
    PLAYERS: 10 * 60 * 1000, // 10 minutes
    HANDS: 2 * 60 * 1000, // 2 minutes
    STATS: 60 * 60 * 1000 // 1 hour
  },
  MAX_SIZE: {
    TABLES: 100,
    PLAYERS: 1000,
    HANDS: 500
  }
} as const;

// ========================================
// WebSocket Events
// ========================================

export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Hand Events
  HAND_START: 'hand:start',
  HAND_CREATED: 'hand:created',
  HAND_UPDATED: 'hand:updated',
  HAND_COMPLETE: 'hand:complete',

  // Action Events
  ACTION_ADD: 'action:add',
  ACTION_ADDED: 'action:added',

  // Table Events
  TABLE_JOIN: 'table:join',
  TABLE_LEAVE: 'table:leave',
  TABLE_UPDATE: 'table:update'
} as const;

// ========================================
// Error Codes
// ========================================

export const ERROR_CODES = {
  // Validation Errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Authentication Errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Resource Errors (404)
  NOT_FOUND: 'NOT_FOUND',
  TABLE_NOT_FOUND: 'TABLE_NOT_FOUND',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  HAND_NOT_FOUND: 'HAND_NOT_FOUND',

  // Business Logic Errors (422)
  DUPLICATE_PLAYER: 'DUPLICATE_PLAYER',
  TABLE_FULL: 'TABLE_FULL',
  INSUFFICIENT_CHIPS: 'INSUFFICIENT_CHIPS',
  INVALID_ACTION: 'INVALID_ACTION',

  // Server Errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

// ========================================
// Performance Thresholds
// ========================================

export const PERFORMANCE = {
  API_RESPONSE_TIME: {
    EXCELLENT: 50, // ms
    GOOD: 200,
    ACCEPTABLE: 500,
    SLOW: 1000
  },
  PAGE_LOAD_TIME: {
    EXCELLENT: 1000, // ms
    GOOD: 2000,
    ACCEPTABLE: 3000,
    SLOW: 5000
  }
} as const;

// ========================================
// Logging Levels
// ========================================

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
} as const;

// ========================================
// Default Values
// ========================================

export const DEFAULTS = {
  TABLE: {
    MAX_PLAYERS: 10,
    GAME_TYPE: 'CASH' as const
  },
  PAGINATION: {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100
  },
  HAND: {
    RAKE_PERCENTAGE: 5, // 5%
    MAX_RAKE: 10 // 최대 레이크
  }
} as const;
