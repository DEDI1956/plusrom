# ROOM PLUS - Quick Start Guide

## 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd room-plus

# Install dependencies
npm install
```

## 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `CLOUDINARY_CLOUD_NAME` - From Cloudinary dashboard
- `CLOUDINARY_API_KEY` - From Cloudinary dashboard  
- `CLOUDINARY_API_SECRET` - From Cloudinary dashboard
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - "development" or "production"

## 3. Database Setup

Option A - Automatic (Recommended):
```bash
# The app automatically creates tables on first run
npm start
```

Option B - Manual:
```bash
# Connect to PostgreSQL
psql -U postgres

# Run schema
\i schema.sql
```

## 4. Run Development Server

```bash
npm start
```

Visit: **http://localhost:3000**

## 5. Testing Features

### Create Room
1. Enter username on homepage
2. Click "Create New Room" button
3. Enter room name and optional description
4. Click "Create Room"

### Join Room
1. Click "Join Room" on any room card
2. Automatically redirected to chat page

### Send Messages
1. Type message in input field
2. Press **Enter** to send
3. Use **Shift+Enter** for new line

### Upload Images
1. Click camera icon in message input
2. Select image file (JPG, PNG, WebP, max 5MB)
3. Image preview appears above input
4. Press Enter to send

### Real-time Features
- Messages appear instantly for all users
- See who's currently typing
- View online users in sidebar
- Get notifications for join/leave events

## 6. Common Issues

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Cloudinary Upload Error
- Verify API credentials in .env
- Check file size (<5MB)
- Ensure file type is allowed

### Socket.IO Connection Error
- Check browser console for CORS errors
- Verify CLIENT_URL matches your domain
- Ensure firewall allows WebSocket connections

## 7. Deployment to Render

1. Push code to GitHub
2. Create PostgreSQL on Render
3. Create Web Service on Render
4. Add environment variables from .env
5. Deploy!

See DEPLOYMENT_CHECKLIST.md for detailed steps.

## 8. API Endpoints

- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `DELETE /api/rooms/:id` - Delete room
- `GET /api/rooms/:id/messages` - Get message history
- `POST /api/upload` - Upload image to Cloudinary
- `GET /health` - Health check

## 9. Socket.IO Events

**Client → Server:**
- `connect_user` - Connect with username
- `join_room` - Join a room
- `send_message` - Send text message
- `send_image` - Send image message
- `user_typing` - Typing indicator start
- `user_stop_typing` - Typing indicator stop

**Server → Client:**
- `room_created` - New room created
- `room_deleted` - Room deleted
- `receive_message` - New message received
- `typing_indicator` - Someone is typing
- `user_list` - Updated user list
- `user_joined_room` - User joined
- `user_left_room` - User left

## 10. Support

- **Issues**: Create GitHub issue
- **Documentation**: See README.md
- **Deployment**: See DEPLOYMENT_CHECKLIST.md

---

**Happy Chatting!** 💬✨