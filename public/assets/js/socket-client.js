/**
 * Socket.IO Client Module
 * Handles real-time communication with the server
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = CONFIG.SOCKET.RECONNECTION_ATTEMPTS;
    this.reconnectDelay = CONFIG.SOCKET.RECONNECTION_DELAY;
    this.eventHandlers = new Map();
    this.messageQueue = [];
  }

  /**
   * Initialize socket connection
   * @returns {Promise<void>}
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(CONFIG.API.BASE_URL, {
          transports: CONFIG.SOCKET.TRANSPORTS,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          timeout: 20000
        });

        this.setupSocketHandlers();
        
        this.once('connect', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.processMessageQueue();
          resolve();
        });

        this.once('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🚀 Socket.IO connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      
      // Re-join current room if any
      const currentRoomId = Utils.storage.get('currentRoomId');
      const username = Utils.storage.get(CONFIG.STORAGE_KEYS.USERNAME);
      
      if (currentRoomId && username) {
        this.emit('join_room', { roomId: currentRoomId, username });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket.IO disconnected:', reason);
      this.connected = false;
      
      if (reason === 'io server disconnect') {
        // Server forced disconnect, manually reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.connected = false;
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.processMessageQueue();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`⏰ Socket.IO reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🚨 Socket.IO reconnection failed after maximum attempts');
      this.connected = false;
      Utils.showNotification('Failed to reconnect to server. Please refresh the page.', 'error');
    });

    // Register default event handlers
    this.on('error', (data) => {
      console.error('Socket error:', data);
      Utils.showNotification(data.message || 'An error occurred', 'error');
    });

    this.on('user_connected', (data) => {
      console.log(`User connected: ${data.username}`);
    });

    this.on('user_disconnected', (data) => {
      console.log(`User disconnected: ${data.username}`);
    });
  }

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.socket) return;
    
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event).push(callback);
    this.socket.on(event, callback);
    
    return this; // Enable chaining
  }

  /**
   * Register one-time event handler
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  once(event, callback) {
    if (!this.socket) return;
    
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    
    this.on(event, wrapper);
    
    return this; // Enable chaining
  }

  /**
   * Remove event handler
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (!this.socket) return;
    
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      if (callback) {
        this.socket.off(event, callback);
      } else {
        // Remove all handlers for this event
        handlers.forEach(handler => this.socket.off(event, handler));
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {*} data - Data to send
   * @param {Function} callback - Optional acknowledgment callback
   */
  emit(event, data, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return this;
    }

    if (!this.connected) {
      // Add to queue if not connected and not a critical event
      if (!['connect', 'disconnect'].includes(event)) {
        this.messageQueue.push({ event, data, callback });
        console.log(`Queueing ${event} event due to disconnected socket`);
      }
      return this;
    }

    try {
      this.socket.emit(event, data, callback);
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      if (callback) {
        callback({ error: 'Failed to send event' });
      }
    }

    return this; // Enable chaining
  }

  /**
   * Process queued messages when reconnected
   */
  processMessageQueue() {
    if (this.messageQueue.length === 0) return;
    
    console.log(`Processing ${this.messageQueue.length} queued messages`);
    
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    queue.forEach(({ event, data, callback }) => {
      this.emit(event, data, callback);
    });
  }

  /**
   * Perform cleanup
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.eventHandlers.clear();
    this.messageQueue = [];
  }

  /**
   * Check if socket is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketClient;
}

// Create singleton instance
window.socketClient = new SocketClient();