/**
 * Hand API
 */

import apiClient from './client';
import type {
  CreateHandRequest,
  CreateHandResponse,
  AddActionRequest,
  AddActionResponse,
  GetHandDetailsResponse,
  Hand,
  Action
} from '@poker-logger/shared';

export const handApi = {
  // Get hand details
  getById: async (id: string) => {
    const response = await apiClient.get<GetHandDetailsResponse>(`/hands/${id}`);
    return response.data;
  },

  // Create hand
  create: async (data: CreateHandRequest): Promise<Hand> => {
    const response = await apiClient.post<CreateHandResponse>('/hands', data);
    return response.data!;
  },

  // Add action to hand
  addAction: async (handId: string, data: Omit<AddActionRequest, 'handId'>): Promise<Action> => {
    const response = await apiClient.post<AddActionResponse>(`/hands/${handId}/actions`, data);
    return response.data!;
  },

  // Complete hand
  complete: async (handId: string) => {
    const response = await apiClient.patch(`/hands/${handId}/complete`);
    return response.data;
  }
};
