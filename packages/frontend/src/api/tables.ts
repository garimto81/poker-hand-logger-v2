/**
 * Table API
 */

import apiClient from './client';
import type {
  CreateTableRequest,
  CreateTableResponse,
  GetTablesResponse,
  Table
} from '@poker-logger/shared';

export const tableApi = {
  // Get all tables
  getAll: async (): Promise<Table[]> => {
    const response = await apiClient.get<GetTablesResponse>('/tables');
    return response.data || [];
  },

  // Get table by ID
  getById: async (id: string): Promise<Table> => {
    const response = await apiClient.get(`/tables/${id}`);
    return response.data;
  },

  // Create table
  create: async (data: CreateTableRequest): Promise<Table> => {
    const response = await apiClient.post<CreateTableResponse>('/tables', data);
    return response.data!;
  },

  // Delete table
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tables/${id}`);
  }
};
