const Room = require('../models/Room');
const Message = require('../models/Message');

const activeUsers = new Map();
const userSockets = new Map();

const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    let currentUser = { username: '', roomId: null };
    
    socket.on('connect_user', ({ username }) => {
      if (!username || username.trim().length === 0) {
        socket.emit('error', { message: 'Username is required' });
        return;
      }
      
      currentUser.username = username;
      activeUsers.set(socket.id, username);
      userSockets.set(username, socket.id);
      
      console.log(`User ${username} connected with socket ${socket.id}`);
      io.emit('user_connected', { username, timestamp: new Date() });
    });

    socket.on('join_room', async ({ roomId, username }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        socket.join(roomId);
        currentUser.roomId = roomId;
        
        // Get recent messages
        const messages = await Message.findByRoomId(roomId);
        
        socket.emit('room_joined', {
          room,
          messages,
          users: getRoomUsers(io, roomId)
        });
        
        // Notify other users
        socket.to(roomId).emit('user_joined_room', {
          username,
          roomId,
          timestamp: new Date()
        });
        
        // Update user list for all in room
        io.to(roomId).emit('user_list', getRoomUsers(io, roomId));
        
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('send_message', async ({ roomId, username, text }) => {
      try {
        if (!text || text.trim().length === 0) return;
        
        const message = await Message.create(roomId, username, text);
        
        io.to(roomId).emit('receive_message', {
          ...message,
          timestamp: message.created_at
        });
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('send_image', async ({ roomId, username, imageUrl }) => {
      try {
        if (!imageUrl) return;
        
        const message = await Message.create(roomId, username, null, imageUrl);
        
        io.to(roomId).emit('receive_message', {
          ...message,
          timestamp: message.created_at
        });
        
      } catch (error) {
        console.error('Error sending image:', error);
        socket.emit('error', { message: 'Failed to send image' });
      }
    });

    socket.on('user_typing', ({ roomId, username }) => {
      socket.to(roomId).emit('typing_indicator', { username, isTyping: true });
    });

    socket.on('user_stop_typing', ({ roomId, username }) => {
      socket.to(roomId).emit('typing_indicator', { username, isTyping: false });
    });

    socket.on('disconnect', () => {
      const username = activeUsers.get(socket.id);
      if (username) {
        activeUsers.delete(socket.id);
        userSockets.delete(username);
        
        console.log(`User disconnected: ${username} (${socket.id})`);
        
        if (currentUser.roomId) {
          socket.to(currentUser.roomId).emit('user_left_room', {
            username,
            timestamp: new Date()
          });
          
          io.to(currentUser.roomId).emit('user_list', getRoomUsers(io, currentUser.roomId));
        }
        
        io.emit('user_disconnected', { username, timestamp: new Date() });
      }
    });
  });
};

const getRoomUsers = (io, roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return [];
  
  const users = [];
  room.forEach(socketId => {
    const username = activeUsers.get(socketId);
    if (username) {
      users.push({
        username,
        socketId
      });
    }
  });
  
  return users;
};

module.exports = { handleSocketConnection, getRoomUsers };