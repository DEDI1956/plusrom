const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Message {
  static async create(roomId, username, textContent = null, imageUrl = null) {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO messages (id, room_id, username, text_content, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [id, roomId, username, textContent, imageUrl]);
      
      // Update room timestamp
      await pool.query('UPDATE rooms SET updated_at = NOW() WHERE id = $1;', [roomId]);
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByRoomId(roomId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM messages 
        WHERE room_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3;
      `;
      const { rows } = await pool.query(query, [roomId, limit, offset]);
      return rows.reverse(); // Return in chronological order
    } catch (error) {
      throw error;
    }
  }

  static async getRoomMessageCount(roomId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM messages WHERE room_id = $1;';
      const { rows } = await pool.query(query, [roomId]);
      return parseInt(rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Message;