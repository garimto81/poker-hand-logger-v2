/**
 * Player API
 */

import apiClient from './client';
import type {
  CreatePlayerRequest,
  CreatePlayerResponse,
  GetPlayersResponse,
  Player
} from '@poker-logger/shared';

export const playerApi = {
  // Get all players
  getAll: async (): Promise<Player[]> => {
    const response = await apiClient.get<GetPlayersResponse>('/players');
    return response.data || [];
  },

  // Get player by ID
  getById: async (id: string): Promise<Player> => {
    const response = await apiClient.get(`/players/${id}`);
    return response.data;
  },

  // Create player
  create: async (data: CreatePlayerRequest): Promise<Player> => {
    const response = await apiClient.post<CreatePlayerResponse>('/players', data);
    return response.data!;
  },

  // Get player stats
  getStats: async (id: string) => {
    const response = await apiClient.get(`/players/${id}/stats`);
    return response.data;
  }
};
