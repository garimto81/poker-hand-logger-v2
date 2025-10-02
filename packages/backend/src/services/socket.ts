/**
 * WebSocket Service - Socket.io Server
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { WS_EVENTS } from '@poker-logger/shared';
import config from '../config';

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`[WebSocket] Socket error:`, error);
      });

      // Join table room
      socket.on('table:join', (tableId: string) => {
        socket.join(`table:${tableId}`);
        console.log(`[WebSocket] Socket ${socket.id} joined table:${tableId}`);

        // Notify others in the room
        socket.to(`table:${tableId}`).emit('user:joined', {
          socketId: socket.id,
          tableId,
          timestamp: new Date()
        });
      });

      // Leave table room
      socket.on('table:leave', (tableId: string) => {
        socket.leave(`table:${tableId}`);
        console.log(`[WebSocket] Socket ${socket.id} left table:${tableId}`);

        // Notify others in the room
        socket.to(`table:${tableId}`).emit('user:left', {
          socketId: socket.id,
          tableId,
          timestamp: new Date()
        });
      });
    });
  }

  /**
   * Broadcast hand created event to all clients in the table room
   */
  public broadcastHandCreated(tableId: string, hand: any) {
    this.io.to(`table:${tableId}`).emit('hand:created', {
      hand,
      timestamp: new Date()
    });
    console.log(`[WebSocket] Broadcasted hand:created to table:${tableId}`);
  }

  /**
   * Broadcast hand updated event
   */
  public broadcastHandUpdated(tableId: string, hand: any) {
    this.io.to(`table:${tableId}`).emit('hand:updated', {
      hand,
      timestamp: new Date()
    });
    console.log(`[WebSocket] Broadcasted hand:updated to table:${tableId}`);
  }

  /**
   * Broadcast action added event
   */
  public broadcastActionAdded(tableId: string, handId: string, action: any) {
    this.io.to(`table:${tableId}`).emit('action:added', {
      handId,
      action,
      timestamp: new Date()
    });
    console.log(`[WebSocket] Broadcasted action:added to table:${tableId}`);
  }

  /**
   * Broadcast hand completed event
   */
  public broadcastHandCompleted(tableId: string, handId: string, result: any) {
    this.io.to(`table:${tableId}`).emit('hand:completed', {
      handId,
      result,
      timestamp: new Date()
    });
    console.log(`[WebSocket] Broadcasted hand:completed to table:${tableId}`);
  }

  /**
   * Broadcast table updated event
   */
  public broadcastTableUpdated(tableId: string, table: any) {
    this.io.to(`table:${tableId}`).emit('table:updated', {
      table,
      timestamp: new Date()
    });
    console.log(`[WebSocket] Broadcasted table:updated to table:${tableId}`);
  }

  /**
   * Get number of connected clients
   */
  public getConnectedCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Get clients in a specific room
   */
  public async getClientsInRoom(roomName: string): Promise<string[]> {
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.map(socket => socket.id);
  }

  /**
   * Get Socket.io instance (for advanced usage)
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let socketService: SocketService | null = null;

export function initializeSocketService(httpServer: HTTPServer): SocketService {
  if (!socketService) {
    socketService = new SocketService(httpServer);
  }
  return socketService;
}

export function getSocketService(): SocketService {
  if (!socketService) {
    throw new Error('Socket service not initialized');
  }
  return socketService;
}
