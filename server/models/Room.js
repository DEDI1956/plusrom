const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Room {
  static async create(name, description = '') {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO rooms (id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [id, name, description]);
      return rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Room name already exists');
      }
      throw error;
    }
  }

  static async findAll() {
    try {
      const query = `
        SELECT r.*, COUNT(m.id) as message_count
        FROM rooms r
        LEFT JOIN messages m ON r.id = m.room_id
        GROUP BY r.id
        ORDER BY r.updated_at DESC;
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM rooms WHERE id = $1;';
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM rooms WHERE id = $1 RETURNING *;';
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async updateTimestamp(id) {
    try {
      const query = `
        UPDATE rooms 
        SET updated_at = NOW() 
        WHERE id = $1 
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Room;