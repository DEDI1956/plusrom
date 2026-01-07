/**
 * Chat Application Module for ROOM PLUS
 * Handles chat room interactions, real-time messaging, and UI state
 */

class ChatApp {
  constructor() {
    this.currentRoom = null;
    this.username = null;
    this.messages = [];
    this.onlineUsers = new Map();
    this.typingUsers = new Set();
    this.messagePagination = {
      limit: CONFIG.MESSAGES.PAGINATION.DEFAULT_LIMIT,
      offset: 0,
      hasMore: true
    };
    this.isLoading = false;
    this.socketEvents = [];
  }

  /**
   * Initialize chat application
   */
  async init() {
    try {
      // Initialize core modules
      ui.initialize();
      
      // Get user session
      this.username = Utils.storage.get(CONFIG.STORAGE_KEYS.USERNAME);
      if (!this.username) {
        // Redirect to homepage if no username
        window.location.href = '/';
        return;
      }
      
      // Load initial data
      await this.loadInitialData();
      
      // Setup socket connection
      await this.setupSocketConnection();
      
      // Setup event handlers
      this.setupChatEventHandlers();
      
      console.log('💬 Chat application initialized for user:', this.username);
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Utils.showNotification('Failed to initialize chat application', 'error');
      ui.setLoading(false);
    }
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    ui.setLoading(true, 'Loading chat data...');
    
    try {
      // Update UI with username
      ui.updateUsername(this.username);
      
      // Load rooms
      await this.loadRooms();
      
      // Join stored room or first available
      const storedRoomId = Utils.storage.get('currentRoomId');
      if (storedRoomId) {
        await this.joinRoom(storedRoomId);
      }
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Utils.showNotification('Failed to load chat data', 'error');
    } finally {
      ui.setLoading(false);
    }
  }

  /**
   * Load rooms list
   */
  async loadRooms() {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const rooms = data.data || [];
      
      this.renderRoomsList(rooms);
      
    } catch (error) {
      console.error('Failed to load rooms:', error);
      Utils.showNotification('Failed to load rooms list', 'error');
    }
  }

  /**
   * Render rooms in sidebar
   */
  renderRoomsList(rooms) {
    const container = document.getElementById('roomList');
    if (!container) return;
    
    if (rooms.length === 0) {
      container.innerHTML = '<div class="empty-rooms">No rooms available</div>';
      return;
    }
    
    const roomsHTML = rooms.map(room => `
      <div class="room-item ${this.currentRoom?.id === room.id ? 'active' : ''}" 
           data-room-id="${room.id}">
        <div class="room-item-icon">💬</div>
        <div class="room-item-content">
          <div class="room-item-name">${Utils.truncateText(room.name, 20)}</div>
          <div class="room-item-messages">${room.message_count || 0} messages</div>
        </div>
        <button class="room-item-delete" data-room-id="${room.id}" title="Delete room">&times;</button>
      </div>
    `).join('');
    
    container.innerHTML = roomsHTML;
    
    // Add click handlers
    container.querySelectorAll('.room-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('room-item-delete')) {
          const roomId = item.dataset.roomId;
          this.joinRoom(roomId);
        }
      });
    });
    
    // Add delete handlers
    container.querySelectorAll('.room-item-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const roomId = btn.dataset.roomId;
        await this.deleteRoom(roomId);
      });
    });
  }

  /**
   * Setup Socket.IO connection
   */
  async setupSocketConnection() {
    try {
      await socketClient.connect();
      
      // Register socket event handlers
      this.registerSocketHandlers();
      
      // Connect user
      socketClient.emit('connect_user', { username: this.username });
      
    } catch (error) {
      console.error('Socket connection failed:', error);
      Utils.showNotification('Failed to connect to real-time server', 'error');
    }
  }

  /**
   * Register Socket.IO event handlers
   */
  registerSocketHandlers() {
    // Message events
    socketClient.on('receive_message', (message) => {
      this.addMessage(message);
    });
    
    // Room events
    socketClient.on('room_created', (data) => {
      this.loadRooms();
    });
    
    socketClient.on('room_deleted', (data) => {
      if (this.currentRoom?.id === data.roomId) {
        this.leaveRoom();
      }
      this.loadRooms();
    });
    
    // User events
    socketClient.on('user_joined_room', (data) => {
      this.addOnlineUser(data.username);
      this.updateOnlineCount();
    });
    
    socketClient.on('user_left_room', (data) => {
      this.removeOnlineUser(data.username);
      this.updateOnlineCount();
    });
    
    socketClient.on('user_list', (users) => {
      this.updateOnlineUsers(users);
      this.updateOnlineCount();
    });
    
    // Typing indicator
    socketClient.on('typing_indicator', (data) => {
      if (data.isTyping) {
        this.typingUsers.add(data.username);
      } else {
        this.typingUsers.delete(data.username);
      }
      this.updateTypingIndicator();
    });
    
    // Error handling
    socketClient.on('error', (data) => {
      Utils.showNotification(data.message, 'error');
    });
  }

  /**
   * Join a room
   */
  async joinRoom(roomId) {
    if (this.currentRoom?.id === roomId) return;
    
    this.isLoading = true;
    ui.setLoading(true, 'Joining room...');
    
    try {
      // Leave current room
      if (this.currentRoom) {
        await this.leaveRoom(false);
      }
      
      // Store current room
      this.currentRoom = { id: roomId };
      Utils.storage.set('currentRoomId', roomId);
      
      // Join via Socket.IO
      socketClient.emit('join_room', {
        roomId,
        username: this.username
      });
      
      // Load room messages
      await this.loadRoomMessages(roomId);
      
      // Update UI
      this.updateRoomUI();
      
    } catch (error) {
      console.error('Failed to join room:', error);
      Utils.showNotification('Failed to join room', 'error');
    } finally {
      this.isLoading = false;
      ui.setLoading(false);
    }
  }

  /**
   * Leave current room
   */
  async leaveRoom(redirect = true) {
    if (!this.currentRoom) return;
    
    // Clear messages
    this.messages = [];
    this.clearMessages();
    
    // Clear room
    this.currentRoom = null;
    Utils.storage.remove('currentRoomId');
    
    // Update UI
    this.updateRoomUI();
    
    // Redirect to home if specified
    if (redirect) {
      window.location.href = '/';
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      Utils.showNotification('Room deleted successfully', 'success');
      
    } catch (error) {
      console.error('Failed to delete room:', error);
      Utils.showNotification('Failed to delete room', 'error');
    }
  }

  /**
   * Load room messages
   */
  async loadRoomMessages(roomId, reset = true) {
    if (reset) {
      this.messages = [];
      this.messagePagination = {
        limit: CONFIG.MESSAGES.PAGINATION.DEFAULT_LIMIT,
        offset: 0,
        hasMore: true
      };
    }
    
    try {
      const url = `/api/rooms/${roomId}/messages?limit=${this.messagePagination.limit}&offset=${this.messagePagination.offset}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const messages = data.data || [];
      
      // Append messages
      this.messages = [...this.messages, ...messages];
      
      // Update pagination
      this.messagePagination.hasMore = data.pagination?.hasMore || false;
      this.messagePagination.offset = this.messages.length;
      
      // Render messages
      this.renderMessages();
      
      // Scroll to bottom for new messages
      if (reset) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      Utils.showNotification('Failed to load messages', 'error');
    }
  }

  /**
   * Add new message to chat
   */
  addMessage(message) {
    this.messages.push(message);
    this.renderMessages();
    
    // Scroll to bottom for new messages
    setTimeout(() => this.scrollToBottom(), 100);
  }

  /**
   * Render messages in chat area
   */
  renderMessages() {
    const container = this.elements.messagesArea;
    if (!container) return;
    
    if (this.messages.length === 0 && this.currentRoom) {
      container.innerHTML = `
        <div class="empty-chat">
          <div class="empty-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Start the conversation!</p>
        </div>
      `;
      return;
    }
    
    const messagesHTML = this.messages.map(message => this.createMessageHTML(message)).join('');
    container.innerHTML = messagesHTML;
  }

  /**
   * Create message HTML
   */
  createMessageHTML(message) {
    const isOwnMessage = message.username === this.username;
    const time = Utils.formatTime(message.created_at);
    
    let messageContent = '';
    
    // Text content
    if (message.text_content) {
      messageContent = `<div class="message-text">${this.escapeHtml(message.text_content)}</div>`;
    }
    
    // Image content
    if (message.image_url) {
      messageContent += `
        <div class="message-image">
          <img src="${message.image_url}" alt="Shared image" loading="lazy">
        </div>
      `;
    }
    
    const avatar = this.getUsernameInitial(message.username);
    
    return `
      <div class="message ${isOwnMessage ? 'message-own' : 'message-other'}">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-username">${Utils.truncateText(message.username, 15)}</span>
            <span class="message-time">${time}</span>
          </div>
          ${messageContent}
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Get username initial for avatar
   */
  getUsernameInitial(username) {
    return username ? username.charAt(0).toUpperCase() : '?';
  }

  /**
   * Clear messages
   */
  clearMessages() {
    if (this.elements.messagesArea) {
      this.elements.messagesArea.innerHTML = '';
    }
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    const container = document.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Update room UI
   */
  updateRoomUI() {
    // Update current room name
    if (this.elements.currentRoomName && this.currentRoom) {
      const room = this.rooms.find(r => r.id === this.currentRoom.id);
      this.elements.currentRoomName.textContent = room ? room.name : 'Room';
    } else {
      this.elements.currentRoomName.textContent = 'Select a Room';
    }
    
    // Update leave button visibility
    if (this.elements.leaveRoomBtn) {
      this.elements.leaveRoomBtn.style.display = this.currentRoom ? 'inline-flex' : 'none';
    }
    
    // Highlight current room in sidebar
    this.updateRoomListHighlight();
  }

  /**
   * Update room list highlighting
   */
  updateRoomListHighlight() {
    const roomItems = document.querySelectorAll('.room-item');
    roomItems.forEach(item => {
      const isActive = item.dataset.roomId === this.currentRoom?.id;
      item.classList.toggle('active', isActive);
    });
  }

  /**
   * Add online user
   */
  addOnlineUser(username) {
    if (username !== this.username) {
      this.onlineUsers.set(username, { username, status: 'online' });
      this.renderOnlineUsers();
    }
  }

  /**
   * Remove online user
   */
  removeOnlineUser(username) {
    this.onlineUsers.delete(username);
    this.renderOnlineUsers();
  }

  /**
   * Update online users
   */
  updateOnlineUsers(users) {
    this.onlineUsers.clear();
    users.forEach(user => {
      if (user.username !== this.username) {
        this.onlineUsers.set(user.username, user);
      }
    });
    this.renderOnlineUsers();
  }

  /**
   * Render online users in sidebar
   */
  renderOnlineUsers() {
    const container = this.elements.onlineUsersList;
    if (!container) return;
    
    if (this.onlineUsers.size === 0) {
      container.innerHTML = '<div class="empty-users">No other users online</div>';
      return;
    }
    
    const usersHTML = Array.from(this.onlineUsers.values()).map(user => `
      <div class="user-item">
        <div class="user-avatar">${this.getUsernameInitial(user.username)}</div>
        <div class="user-name">${Utils.truncateText(user.username, 15)}</div>
        <div class="user-status online"></div>
      </div>
    `).join('');
    
    container.innerHTML = usersHTML;
  }

  /**
   * Update online count
   */
  updateOnlineCount() {
    if (this.elements.onlineCount) {
      const count = this.onlineUsers.size + 1; // +1 for current user
      this.elements.onlineCount.textContent = count;
    }
  }

  /**
   * Update typing indicator
   */
  updateTypingIndicator() {
    const indicator = this.elements.typingIndicator;
    const usersText = this.elements.typingUsers;
    
    if (!indicator || !usersText) return;
    
    if (this.typingUsers.size === 0) {
      indicator.style.display = 'none';
      return;
    }
    
    indicator.style.display = 'flex';
    
    const users = Array.from(this.typingUsers);
    const usersString = users.slice(0, 2).join(' and ');
    const extraCount = Math.max(0, users.length - 2);
    
    let indicatorText = usersString;
    if (extraCount > 0) {
      indicatorText += ` and ${extraCount} other${extraCount > 1 ? 's' : ''}`;
    }
    indicatorText += ` ${users.length > 1 ? 'are' : 'is'} typing...`;
    
    usersText.textContent = indicatorText;
  }

  /**
   * Setup chat event handlers
   */
  setupChatEventHandlers() {
    // Send message
    document.addEventListener('sendMessage', async (e) => {
      const { text, image } = e.detail;
      
      if (!this.currentRoom) {
        Utils.showNotification('Please join a room first', 'warning');
        return;
      }
      
      // Send text message
      if (text) {
        socketClient.emit('send_message', {
          roomId: this.currentRoom.id,
          username: this.username,
          text
        });
      }
      
      // Send image message
      if (image) {
        try {
          // Upload image first
          const formData = new FormData();
          formData.append('image', image.file);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) throw new Error('Image upload failed');
          
          const data = await response.json();
          const imageUrl = data.data.url;
          
          // Send image via socket
          socketClient.emit('send_image', {
            roomId: this.currentRoom.id,
            username: this.username,
            imageUrl
          });
          
        } catch (error) {
          console.error('Failed to upload image:', error);
          Utils.showNotification('Failed to upload image', 'error');
        }
      }
    });

    // User typing
    document.addEventListener('userTyping', () => {
      if (this.currentRoom) {
        socketClient.emit('user_typing', {
          roomId: this.currentRoom.id,
          username: this.username
        });
      }
    });

    // User stop typing
    document.addEventListener('userStopTyping', () => {
      if (this.currentRoom) {
        socketClient.emit('user_stop_typing', {
          roomId: this.currentRoom.id,
          username: this.username
        });
      }
    });

    // Leave room
    document.addEventListener('leaveRoom', () => {
      this.leaveRoom();
    });
  }

  /**
   * Cache DOM elements
   */
  cacheDOM() {
    this.elements = {
      messagesArea: document.getElementById('messagesArea'),
      onlineUsersList: document.getElementById('onlineUsersList'),
      roomList: document.getElementById('roomList'),
      currentRoomName: document.getElementById('currentRoomName'),
      onlineCount: document.getElementById('onlineCount'),
      typingIndicator: document.getElementById('typingIndicator'),
      typingUsers: document.getElementById('typingUsers'),
      leaveRoomBtn: document.getElementById('leaveRoomBtn')
    };
  }
}

// Initialize chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatApp = new ChatApp();
  chatApp.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatApp;
}