/**
 * Configuration module for ROOM PLUS
 * Centralized configuration values
 */

const CONFIG = {
  API: {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
      ROOMS: '/api/rooms',
      UPLOAD: '/api/upload',
      HEALTH: '/health'
    }
  },
  
  SOCKET: {
    TRANSPORTS: ['websocket', 'polling'],
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 3000
  },
  
  VALIDATION: {
    USERNAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 20,
      PATTERN: /^[a-zA-Z0-9_-]+$/
    },
    ROOM_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 255
    },
    IMAGE: {
      MAX_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    }
  },
  
  MESSAGES: {
    MAX_RETRIES: 3,
    PAGINATION: {
      DEFAULT_LIMIT: 50,
      LOAD_MORE_THRESHOLD: 100
    }
  },
  
  UI: {
    ANIMATION_DURATION: 300,
    TYPING_TIMEOUT: 1000,
    NOTIFICATION_DURATION: 5000
  },
  
  STORAGE_KEYS: {
    USERNAME: 'rp_username',
    THEME: 'rp_theme'
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

// Make available globally
window.CONFIG = CONFIG;
