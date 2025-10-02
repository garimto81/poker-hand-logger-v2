/**
 * WebSocket Client Service - Socket.io Client
 */

import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(url: string = 'http://localhost:3000') {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return this.socket;
    }

    console.log('[WebSocket] Connecting to', url);

    this.socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.setupEventHandlers();

    return this.socket;
  }

  /**
   * Setup event handlers for connection events
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error('[WebSocket] Connection error:', error.message);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a table room
   */
  joinTable(tableId: string) {
    if (!this.socket) {
      console.error('[WebSocket] Not connected');
      return;
    }

    console.log(`[WebSocket] Joining table: ${tableId}`);
    this.socket.emit('table:join', tableId);
  }

  /**
   * Leave a table room
   */
  leaveTable(tableId: string) {
    if (!this.socket) {
      console.error('[WebSocket] Not connected');
      return;
    }

    console.log(`[WebSocket] Leaving table: ${tableId}`);
    this.socket.emit('table:leave', tableId);
  }

  /**
   * Listen for hand created events
   */
  onHandCreated(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('hand:created', callback);
  }

  /**
   * Listen for hand updated events
   */
  onHandUpdated(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('hand:updated', callback);
  }

  /**
   * Listen for action added events
   */
  onActionAdded(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('action:added', callback);
  }

  /**
   * Listen for hand completed events
   */
  onHandCompleted(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('hand:completed', callback);
  }

  /**
   * Listen for table updated events
   */
  onTableUpdated(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('table:updated', callback);
  }

  /**
   * Listen for user joined events
   */
  onUserJoined(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('user:joined', callback);
  }

  /**
   * Listen for user left events
   */
  onUserLeft(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('user:left', callback);
  }

  /**
   * Remove event listener
   */
  off(eventName: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.off(eventName, callback);
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
const socketClient = new SocketClient();

export default socketClient;
