-- ROOM PLUS Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  text_content TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_rooms_updated_at ON rooms(updated_at DESC);

-- Trigger to update rooms.updated_at on message insert
CREATE OR REPLACE FUNCTION update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rooms SET updated_at = NOW() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_room_timestamp();

-- Sample data (optional)
-- INSERT INTO rooms (name, description) VALUES 
--   ('General', 'General discussion room'),
--   ('Tech Talk', 'Technology discussions'),
--   ('Random', 'Random conversations');