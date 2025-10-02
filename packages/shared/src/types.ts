/**
 * 포커 핸드 로거 v2.0 - 공유 타입 정의
 */

// ========================================
// Enums
// ========================================

export enum Street {
  PREFLOP = 'PREFLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN'
}

export enum ActionType {
  FOLD = 'FOLD',
  CHECK = 'CHECK',
  CALL = 'CALL',
  BET = 'BET',
  RAISE = 'RAISE',
  ALL_IN = 'ALL_IN'
}

export enum Position {
  UTG = 'UTG',
  UTG_PLUS_1 = 'UTG+1',
  UTG_PLUS_2 = 'UTG+2',
  MP = 'MP',
  MP_PLUS_1 = 'MP+1',
  HJ = 'HJ',
  CO = 'CO',
  BTN = 'BTN',
  SB = 'SB',
  BB = 'BB'
}

export enum GameType {
  CASH = 'CASH',
  TOURNAMENT = 'TOURNAMENT',
  SIT_AND_GO = 'SIT_AND_GO'
}

// ========================================
// Database Models
// ========================================

export interface Table {
  id: string;
  name: string;
  gameType: GameType;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  totalHands: number;
  totalWinnings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hand {
  id: string;
  tableId: string;
  handNumber: number;
  street: Street;
  pot: number;
  rake: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerInHand {
  id: string;
  handId: string;
  playerId: string;
  position: Position;
  startingChips: number;
  endingChips: number;
  cards?: string; // JSON: ["As", "Kh"]
  won: number;
  showedDown: boolean;
}

export interface Action {
  id: string;
  handId: string;
  playerId: string;
  street: Street;
  actionType: ActionType;
  amount: number;
  sequence: number;
  timestamp: Date;
}

// ========================================
// API Request/Response Types
// ========================================

export interface CreateTableRequest {
  name: string;
  gameType: GameType;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
}

export interface CreateTableResponse {
  success: boolean;
  data?: Table;
  error?: string;
}

export interface GetTablesResponse {
  success: boolean;
  data?: Table[];
  error?: string;
}

export interface CreatePlayerRequest {
  name: string;
  email?: string;
}

export interface CreatePlayerResponse {
  success: boolean;
  data?: Player;
  error?: string;
}

export interface GetPlayersResponse {
  success: boolean;
  data?: Player[];
  error?: string;
}

export interface CreateHandRequest {
  tableId: string;
  handNumber: number;
  players: {
    playerId: string;
    position: Position;
    startingChips: number;
    cards?: string[];
  }[];
}

export interface CreateHandResponse {
  success: boolean;
  data?: Hand;
  error?: string;
}

export interface AddActionRequest {
  handId: string;
  playerId: string;
  street: Street;
  actionType: ActionType;
  amount: number;
}

export interface AddActionResponse {
  success: boolean;
  data?: Action;
  error?: string;
}

export interface GetHandDetailsResponse {
  success: boolean;
  data?: {
    hand: Hand;
    players: (PlayerInHand & { player: Player })[];
    actions: (Action & { player: Player })[];
  };
  error?: string;
}

// ========================================
// WebSocket Events
// ========================================

export interface SocketEvents {
  // Client → Server
  'hand:start': CreateHandRequest;
  'action:add': AddActionRequest;
  'hand:complete': { handId: string };

  // Server → Client
  'hand:created': Hand;
  'action:added': Action;
  'hand:updated': Hand;
  'error': { message: string };
}

// ========================================
// Utility Types
// ========================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
}

// ========================================
// Frontend State Types
// ========================================

export interface AppState {
  currentTable: Table | null;
  currentHand: Hand | null;
  players: Player[];
  tables: Table[];
  isLoading: boolean;
  error: string | null;
}

export interface HandState {
  id: string;
  handNumber: number;
  street: Street;
  pot: number;
  players: Map<string, PlayerInHand>;
  actions: Action[];
}
