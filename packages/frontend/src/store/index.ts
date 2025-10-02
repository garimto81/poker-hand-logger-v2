/**
 * Zustand Store - Global Application State
 */

import { create } from 'zustand';
import type { Table, Player, Hand } from '@poker-logger/shared';

interface AppState {
  // Current selections
  currentTable: Table | null;
  currentHand: Hand | null;

  // Data
  tables: Table[];
  players: Player[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentTable: (table: Table | null) => void;
  setCurrentHand: (hand: Hand | null) => void;
  setTables: (tables: Table[]) => void;
  setPlayers: (players: Player[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Add new items
  addTable: (table: Table) => void;
  addPlayer: (player: Player) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  currentTable: null,
  currentHand: null,
  tables: [],
  players: [],
  isLoading: false,
  error: null,

  // Setters
  setCurrentTable: (table) => set({ currentTable: table }),
  setCurrentHand: (hand) => set({ currentHand: hand }),
  setTables: (tables) => set({ tables }),
  setPlayers: (players) => set({ players }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Add new items
  addTable: (table) => set((state) => ({
    tables: [table, ...state.tables]
  })),
  addPlayer: (player) => set((state) => ({
    players: [player, ...state.players]
  }))
}));
