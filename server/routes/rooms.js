const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const router = express.Router();

// Validation middleware
const validateRoomName = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Room name is required and must be a non-empty string' });
  }
  if (name.trim().length > 255) {
    return res.status(400).json({ error: 'Room name must be less than 255 characters' });
  }
  req.body.name = name.trim();
  next();
};

// GET /api/rooms - Get all rooms
router.get('/', async (req, res, next) => {
  try {
    const rooms = await Room.findAll();
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/rooms - Create a new room
router.post('/', validateRoomName, async (req, res, next) => {
  try {
    const { name, description = '' } = req.body;
    
    // Check if room already exists
    const existingRooms = await Room.findAll();
    const roomExists = existingRooms.some(room => 
      room.name.toLowerCase() === name.toLowerCase()
    );
    
    if (roomExists) {
      return res.status(409).json({ 
        error: 'Room with this name already exists' 
      });
    }
    
    const room = await Room.create(name, description);
    
    // Broadcast to all connected clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('room_created', {
        room,
        timestamp: new Date()
      });
    }
    
    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rooms/:id - Delete a room
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if room exists
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Delete the room (messages will be cascade deleted)
    const deletedRoom = await Room.delete(id);
    
    // Broadcast to all connected clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('room_deleted', {
        roomId: id,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      data: deletedRoom,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/rooms/:id/messages - Get messages for a room with pagination
router.get('/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Validate room exists
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const messages = await Message.findByRoomId(id, limit, offset);
    const totalCount = await Message.getRoomMessageCount(id);
    
    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;