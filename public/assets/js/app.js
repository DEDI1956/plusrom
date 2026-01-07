/**
 * Main Application Module for Homepage
 * Handles room listing, user interactions, and navigation
 */

class App {
  constructor() {
    this.rooms = [];
    this.baseStats = {
      onlineUsers: 0,
      activeRooms: 0,
      totalMessages: 0
    };
    this.isLoading = false;
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      // Initialize modules
      ui.initialize();
      
      // Load data
      await this.loadRooms();
      this.updateUI();
      
      // Setup real-time updates
      await this.setupSocketConnection();
      
      // Update stats periodically
      this.updateStats();
      setInterval(() => this.updateStats(), 30000); // Every 30 seconds
      
      console.log('🚀 ROOM PLUS homepage initialized');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Utils.showNotification('Failed to load application', 'error');
    }
  }

  /**
   * Setup Socket.IO connection for real-time updates
   */
  async setupSocketConnection() {
    try {
      await socketClient.connect();
      
      // Register socket event handlers
      socketClient.on('room_created', (data) => {
        console.log('New room created:', data.room);
        this.addRoomToList(data.room);
        this.updateStats();
      });
      
      socketClient.on('room_deleted', (data) => {
        console.log('Room deleted:', data.roomId);
        this.removeRoomFromList(data.roomId);
        this.updateStats();
      });
      
      socketClient.on('user_connected', () => {
        this.updateStats();
      });
      
      socketClient.on('user_disconnected', () => {
        this.updateStats();
      });
      
    } catch (error) {
      console.error('Socket connection failed:', error);
      // Continue without real-time updates
    }
  }

  /**
   * Load rooms from API
   */
  async loadRooms() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    ui.setLoading(true, 'Loading rooms...');
    
    try {
      const response = await fetch('/api/rooms');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.rooms = data.data || [];
      
      // Sort rooms by message count (most active first)
      this.rooms.sort((a, b) => (b.message_count || 0) - (a.message_count || 0));
      
      this.renderRooms();
      
    } catch (error) {
      console.error('Failed to load rooms:', error);
      Utils.showNotification('Failed to load rooms', 'error');
      this.renderError();
    } finally {
      this.isLoading = false;
      ui.setLoading(false);
    }
  }

  /**
   * Render rooms in the UI
   */
  renderRooms() {
    const container = document.getElementById('roomsContainer');
    if (!container) return;
    
    if (this.rooms.length === 0) {
      container.innerHTML = `
        <div class="empty-rooms">
          <div class="empty-icon">📋</div>
          <h3>No rooms yet</h3>
          <p>Be the first to create a room!</p>
        </div>
      `;
      return;
    }
    
    const roomsHTML = this.rooms.map(room => this.createRoomCard(room)).join('');
    container.innerHTML = `
      <div class="rooms-grid">
        ${roomsHTML}
      </div>
    `;
    
    // Add click handlers to room cards
    this.addRoomCardHandlers();
  }

  /**
   * Create a room card HTML
   */
  createRoomCard(room) {
    const messageCount = room.message_count || 0;
    const formattedDate = new Date(room.updated_at).toLocaleDateString();
    
    return `
      <div class="room-card glass-effect animate-fade-in" data-room-id="${room.id}">
        <div class="room-header">
          <div class="room-icon">💬</div>
          <h3 class="room-name">${Utils.truncateText(room.name, 25)}</h3>
        </div>
        
        <div class="room-stats">
          <div class="stat">
            <span class="stat-icon">💬</span>
            <span class="stat-value">${messageCount}</span>
            <span class="stat-label">messages</span>
          </div>
        </div>
        
        <div class="room-footer">
          <div class="room-date">Updated: ${formattedDate}</div>
          <button class="luxury-button btn-join-room" data-room-id="${room.id}">
            Join Room
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Add event handlers to room cards
   */
  addRoomCardHandlers() {
    const joinButtons = document.querySelectorAll('.btn-join-room');
    joinButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const roomId = e.target.dataset.roomId;
        this.joinRoom(roomId);
      });
    });
  }

  /**
   * Join a room
   */
  joinRoom(roomId) {
    const username = Utils.storage.get(CONFIG.STORAGE_KEYS.USERNAME);
    if (!username) {
      Utils.showNotification('Please enter a username first', 'warning');
      return;
    }
    
    // Store room ID and navigate to chat
    Utils.storage.set('currentRoomId', roomId);
    window.location.href = '/chat.html';
  }

  /**
   * Add room to list (real-time update)
   */
  addRoomToList(room) {
    // Check if room already exists
    if (this.rooms.some(r => r.id === room.id)) {
      this.updateRoomInList(room);
      return;
    }
    
    this.rooms.unshift(room); // Add to beginning
    this.renderRooms();
  }

  /**
   * Update room in list
   */
  updateRoomInList(room) {
    const index = this.rooms.findIndex(r => r.id === room.id);
    if (index > -1) {
      this.rooms[index] = room;
      this.renderRooms();
    }
  }

  /**
   * Remove room from list (real-time update)
   */
  removeRoomFromList(roomId) {
    this.rooms = this.rooms.filter(room => room.id !== roomId);
    this.renderRooms();
  }

  /**
   * Render error state
   */
  renderError() {
    const container = document.getElementById('roomsContainer');
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-rooms">
        <div class="error-icon">⚠️</div>
        <h3>Failed to load rooms</h3>
        <p>Please check your connection and try again.</p>
        <button class="luxury-button" onclick="window.location.reload()">
          Retry
        </button>
      </div>
    `;
  }

  /**
   * Create a new room
   */
  async createRoom(name, description) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    ui.setLoading(true, 'Creating room...');
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const room = data.data;
      
      Utils.showNotification('Room created successfully!', 'success');
      
      // Auto-join the new room
      setTimeout(() => {
        this.joinRoom(room.id);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to create room:', error);
      Utils.showNotification(error.message || 'Failed to create room', 'error');
    } finally {
      this.isLoading = false;
      ui.setLoading(false);
    }
  }

  /**
   * Update application stats
   */
  async updateStats() {
    try {
      // Calculate stats based on current data
      const activeRooms = this.rooms.length;
      const totalMessages = this.rooms.reduce((sum, room) => sum + (room.message_count || 0), 0);
      
      // Approximate online users (could be enhanced with Socket.IO presence)
      const onlineUsers = Math.floor(activeRooms * 3 + Math.random() * 10);
      
      // Update UI
      if (document.getElementById('onlineUsers')) {
        this.animateCounter('onlineUsers', onlineUsers);
      }
      if (document.getElementById('activeRooms')) {
        document.getElementById('activeRooms').textContent = activeRooms;
      }
      if (document.getElementById('totalMessages')) {
        this.animateCounter('totalMessages', totalMessages);
      }
      
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  /**
   * Animate counter value
   */
  animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
      
      element.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Update UI state
   */
  updateUI() {
    // Update any dynamic UI elements
    const appVersion = '1.0.0';
    console.log(`ROOM PLUS v${appVersion} loaded`);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  app.init();
});

// Handle create room form (from modal)
document.addEventListener('createRoom', (e) => {
  const { name, description } = e.detail;
  
  if (app && typeof app.createRoom === 'function') {
    app.createRoom(name, description);
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}