/**
 * UI Module for ROOM PLUS
 * Handles all DOM manipulation and UI interactions
 */

class UI {
  constructor() {
    this.elements = {};
    this.mobileMenuOpen = false;
    this.currentImage = null;
    this.typingUsers = new Set();
    this.typingTimer = null;
  }

  /**
   * Initialize UI elements
   */
  initialize() {
    this.cacheDOM();
    this.bindEvents();
    this.setupMobileMenu();
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheDOM() {
    // Common elements
    this.elements = {
      // Forms
      enterForm: document.getElementById('enterForm'),
      createRoomForm: document.getElementById('createRoomForm'),
      messageForm: document.getElementById('messageForm'),
      
      // Inputs
      usernameInput: document.getElementById('username'),
      messageInput: document.getElementById('messageInput'),
      roomNameInput: document.getElementById('roomName'),
      imageInput: document.getElementById('imageInput'),
      
      // Buttons
      createRoomBtn: document.getElementById('createRoomBtn'),
      leaveRoomBtn: document.getElementById('leaveRoomBtn'),
      uploadImageBtn: document.getElementById('uploadImageBtn'),
      removeImageBtn: document.getElementById('removeImageBtn'),
      sendBtn: document.getElementById('sendBtn'),
      
      // Containers
      roomsContainer: document.getElementById('roomsContainer'),
      roomsGrid: document.querySelector('.rooms-grid'),
      messagesArea: document.getElementById('messagesArea'),
      roomList: document.getElementById('roomList'),
      onlineUsersList: document.getElementById('onlineUsersList'),
      typingIndicator: document.getElementById('typingIndicator'),
      typingUsers: document.getElementById('typingUsers'),
      
      // Modals
      createRoomModal: document.getElementById('createRoomModal'),
      closeModal: document.getElementById('closeModal'),
      cancelCreate: document.getElementById('cancelCreate'),
      
      // Chat specific
      sidebar: document.getElementById('sidebar'),
      mobileMenuToggle: document.getElementById('mobileMenuToggle'),
      currentRoomName: document.getElementById('currentRoomName'),
      currentUsername: document.getElementById('currentUsername'),
      onlineCount: document.getElementById('onlineCount'),
      imagePreview: document.getElementById('imagePreview'),
      previewImage: document.getElementById('previewImage'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      
      // Stats
      onlineUsers: document.getElementById('onlineUsers'),
      activeRooms: document.getElementById('activeRooms'),
      totalMessages: document.getElementById('totalMessages'),
      
      // Notification container
      notificationContainer: document.getElementById('notificationContainer')
    };
  }

  /**
   * Bind UI events
   */
  bindEvents() {
    // Form submissions
    if (this.elements.enterForm) {
      this.elements.enterForm.addEventListener('submit', this.handleEnter.bind(this));
    }
    
    if (this.elements.createRoomForm) {
      this.elements.createRoomForm.addEventListener('submit', this.handleCreateRoom.bind(this));
    }
    
    if (this.elements.messageForm) {
      this.elements.messageForm.addEventListener('submit', this.handleSendMessage.bind(this));
    }

    // Button clicks
    if (this.elements.createRoomBtn) {
      this.elements.createRoomBtn.addEventListener('click', this.showCreateRoomModal.bind(this));
    }
    
    if (this.elements.leaveRoomBtn) {
      this.elements.leaveRoomBtn.addEventListener('click', this.handleLeaveRoom.bind(this));
    }
    
    if (this.elements.uploadImageBtn) {
      this.elements.uploadImageBtn.addEventListener('click', this.handleImageUpload.bind(this));
    }
    
    if (this.elements.removeImageBtn) {
      this.elements.removeImageBtn.addEventListener('click', this.removeImagePreview.bind(this));
    }

    // Modal controls
    if (this.elements.closeModal) {
      this.elements.closeModal.addEventListener('click', this.hideCreateRoomModal.bind(this));
    }
    
    if (this.elements.cancelCreate) {
      this.elements.cancelCreate.addEventListener('click', this.hideCreateRoomModal.bind(this));
    }

    // Image input
    if (this.elements.imageInput) {
      this.elements.imageInput.addEventListener('change', this.handleImageSelect.bind(this));
    }

    // Textarea auto-resize
    if (this.elements.messageInput) {
      this.elements.messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));
      this.elements.messageInput.addEventListener('keydown', this.handleMessageKeydown.bind(this));
      this.elements.messageInput.addEventListener('input', this.handleTyping.bind(this));
    }

    // Modal backdrop click
    if (this.elements.createRoomModal) {
      this.elements.createRoomModal.addEventListener('click', (e) => {
        if (e.target === this.elements.createRoomModal) {
          this.hideCreateRoomModal();
        }
      });
    }

    // Prevent form submission on enter in textarea
    if (this.elements.messageInput) {
      this.elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (this.elements.messageForm) {
            this.elements.messageForm.dispatchEvent(new Event('submit'));
          }
        }
      });
    }
  }

  /**
   * Setup mobile menu interactions
   */
  setupMobileMenu() {
    if (this.elements.mobileMenuToggle) {
      this.elements.mobileMenuToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    if (this.elements.sidebar) {
      this.elements.sidebar.classList.toggle('mobile-active', this.mobileMenuOpen);
    }
    
    if (this.elements.mobileMenuToggle) {
      this.elements.mobileMenuToggle.classList.toggle('active', this.mobileMenuOpen);
    }
  }

  /**
   * Hide mobile menu
   */
  hideMobileMenu() {
    this.mobileMenuOpen = false;
    
    if (this.elements.sidebar) {
      this.elements.sidebar.classList.remove('mobile-active');
    }
    
    if (this.elements.mobileMenuToggle) {
      this.elements.mobileMenuToggle.classList.remove('active');
    }
  }

  /**
   * Handle username entry form
   */
  handleEnter(e) {
    e.preventDefault();
    
    const username = this.elements.usernameInput?.value.trim();
    const validation = Utils.validateUsername(username);
    
    if (!validation.isValid) {
      Utils.showNotification(validation.message, 'error');
      return;
    }
    
    Utils.storage.set(CONFIG.STORAGE_KEYS.USERNAME, username);
    window.location.href = '/chat.html';
  }

  /**
   * Show create room modal
   */
  showCreateRoomModal() {
    if (this.elements.createRoomModal) {
      this.elements.createRoomModal.classList.add('active');
      this.elements.roomNameInput?.focus();
    }
  }

  /**
   * Hide create room modal
   */
  hideCreateRoomModal() {
    if (this.elements.createRoomModal) {
      this.elements.createRoomModal.classList.remove('active');
      if (this.elements.createRoomForm) {
        this.elements.createRoomForm.reset();
      }
    }
  }

  /**
   * Handle room creation
   */
  handleCreateRoom(e) {
    e.preventDefault();
    
    const roomName = this.elements.roomNameInput?.value.trim();
    const roomDescription = document.getElementById('roomDescription')?.value.trim() || '';
    
    if (!roomName) {
      Utils.showNotification('Room name is required', 'error');
      return;
    }
    
    // Dispatch custom event for app to handle
    document.dispatchEvent(new CustomEvent('createRoom', {
      detail: { name: roomName, description: roomDescription }
    }));
    
    this.hideCreateRoomModal();
  }

  /**
   * Handle message sending
   */
  handleSendMessage(e) {
    e.preventDefault();
    
    const messageText = this.elements.messageInput?.value.trim();
    
    if (!messageText && !this.currentImage) {
      return;
    }
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('sendMessage', {
      detail: {
        text: messageText,
        image: this.currentImage
      }
    }));
    
    // Clear input
    this.elements.messageInput.value = '';
    this.removeImagePreview();
    this.autoResizeTextarea();
  }

  /**
   * Handle typing indicator
   */
  handleTyping() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    // Dispatch typing event
    document.dispatchEvent(new CustomEvent('userTyping'));
    
    // Set timer to stop typing indicator
    this.typingTimer = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('userStopTyping'));
    }, CONFIG.UI.TYPING_TIMEOUT);
  }

  /**
   * Handle message keydown
   */
  handleMessageKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.elements.messageForm) {
        this.elements.messageForm.dispatchEvent(new Event('submit'));
      }
    }
  }

  /**
   * Auto-resize textarea
   */
  autoResizeTextarea() {
    if (!this.elements.messageInput) return;
    
    this.elements.messageInput.style.height = 'auto';
    this.elements.messageInput.style.height = this.elements.messageInput.scrollHeight + 'px';
  }

  /**
   * Trigger image upload
   */
  handleImageUpload() {
    this.elements.imageInput?.click();
  }

  /**
   * Handle image selection
   */
  handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validation = this.validateImageFile(file);
    if (!validation.isValid) {
      Utils.showNotification(validation.message, 'error');
      return;
    }
    
    // Read and preview image
    const reader = new FileReader();
    reader.onload = (event) => {
      this.showImagePreview(event.target.result, file);
    };
    reader.readAsDataURL(file);
    
    // Clear input value to allow re-uploading same file
    e.target.value = '';
  }

  /**
   * Show image preview
   */
  showImagePreview(dataUrl, file) {
    if (!this.elements.imagePreview || !this.elements.previewImage) return;
    
    this.currentImage = { dataUrl, file };
    this.elements.previewImage.src = dataUrl;
    this.elements.imagePreview.style.display = 'flex';
    
    // Auto-resize textarea
    this.autoResizeTextarea();
  }

  /**
   * Remove image preview
   */
  removeImagePreview() {
    if (!this.elements.imagePreview) return;
    
    this.currentImage = null;
    this.elements.imagePreview.style.display = 'none';
    
    if (this.elements.previewImage) {
      this.elements.previewImage.src = '';
    }
  }

  /**
   * Handle leave room
   */
  handleLeaveRoom() {
    if (confirm('Are you sure you want to leave this room?')) {
      document.dispatchEvent(new CustomEvent('leaveRoom'));
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file) {
    const { MAX_SIZE, ALLOWED_TYPES } = CONFIG.VALIDATION.IMAGE;
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        message: 'Only JPG, PNG, and WebP images are allowed'
      };
    }
    
    if (file.size > MAX_SIZE) {
      return {
        isValid: false,
        message: 'Image size must be less than 5MB'
      };
    }
    
    return { isValid: true };
  }

  /**
   * Update username in UI
   */
  updateUsername(username) {
    if (this.elements.currentUsername) {
      this.elements.currentUsername.textContent = username;
    }
  }

  /**
   * Set loading state
   */
  setLoading(state, message = 'Loading...') {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.toggle('active', state);
      
      const messageEl = this.elements.loadingOverlay.querySelector('p');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}

// Create singleton instance
window.ui = new UI();