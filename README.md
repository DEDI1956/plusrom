# ROOM PLUS - Aplikasi Chat Real-time

![Room Plus Logo](https://img.shields.io/badge/Room-Plus-blue?style=for-the-badge&logo=chat)
![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## 📱 Deskripsi

ROOM PLUS adalah aplikasi chat real-time modern yang memungkinkan pengguna untuk berkomunikasi dalam room/grup dengan fitur-fitur canggih. Aplikasi ini dirancang untuk memberikan pengalaman chat yang seamless dan interaktif dengan dukungan room management yang powerful.

## ✨ Fitur Utama

### 💬 Chat Real-time
- Pesan instant delivery menggunakan WebSocket
- Typing indicators untuk menunjukkan aktivitas pengguna
- Message status (sent, delivered, read)
- Support untuk emoji dan reactions

### 🏠 Room Management
- Create, join, dan leave room
- Room privacy settings (public/private)
- Room member management
- Room descriptions dan topics
- Room invitation system

### 👥 User Management
- User registration dan authentication
- User profiles dengan avatar
- Online/offline status
- User roles dan permissions
- Block dan unblock users

### 🎨 Interface
- Modern dan responsive design
- Dark/Light mode toggle
- Mobile-friendly interface
- Customizable themes
- Chat history dengan pagination

### 🔒 Security
- End-to-end encryption (opsional)
- Secure authentication
- Rate limiting
- Message sanitization
- User verification

### 📱 Multi-platform Support
- Web browser
- Mobile responsive
- PWA (Progressive Web App) support
- Cross-platform compatibility

## 🚀 Teknologi

### Frontend
- **Framework**: React.js / Vue.js / Vanilla JavaScript
- **Styling**: CSS3 / Tailwind CSS / Styled Components
- **State Management**: Redux / Vuex / Context API
- **WebSocket**: Socket.io / native WebSocket

### Backend
- **Runtime**: Node.js / Python / PHP
- **Framework**: Express.js / Koa / FastAPI / Laravel
- **Database**: MongoDB / PostgreSQL / MySQL
- **Real-time**: Socket.io / WebSocket

### Infrastructure
- **Hosting**: AWS / Google Cloud / DigitalOcean
- **CDN**: Cloudflare / AWS CloudFront
- **Database**: MongoDB Atlas / AWS RDS
- **Cache**: Redis / Memcached

## 📦 Instalasi

### Prerequisites
- Node.js (v14 atau lebih baru)
- npm atau yarn
- MongoDB/PostgreSQL
- Redis (opsional, untuk caching)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/room-plus.git
cd room-plus
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
```

### 3. Environment Configuration
Buat file `.env` di root directory:
```env
# Database
DATABASE_URL=mongodb://localhost:27017/roomplus
# atau
DATABASE_URL=postgresql://user:password@localhost:5432/roomplus

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-jwt-secret-key

# Redis (opsional)
REDIS_URL=redis://localhost:6379

# WebSocket
WS_PORT=3001

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 4. Database Setup
```bash
# Run database migrations
npm run migrate

# Seed initial data (opsional)
npm run seed
```

### 5. Start Development Server
```bash
# Start backend server
npm run dev

# Start frontend (di terminal baru)
cd client
npm start
```

## 🏃‍♂️ Menjalankan Aplikasi

### Development Mode
```bash
# Backend
npm run dev

# Frontend
cd client && npm start
```

### Production Mode
```bash
# Build frontend
cd client && npm run build

# Start production server
npm run start
```

## 📚 Penggunaan

### Untuk Pengguna

1. **Registrasi/Login**
   - Buat akun baru atau login dengan akun yang ada
   - Verifikasi email (jika diaktifkan)

2. **Membuat Room**
   - Klik "Create Room" di dashboard
   - Set nama room, deskripsi, dan privacy settings
   - Invite pengguna lain atau buat public

3. **Bergabung Room**
   - Browse room public
   - Gunakan room code untuk private room
   - Accept invitation dari pengguna lain

4. **Chatting**
   - Type pesan dan tekan Enter
   - Use @mention untuk mention pengguna
   - Upload file/gambar (jika diizinkan)

### Untuk Developer

#### API Endpoints

**Authentication**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

**Room Management**
```
GET    /api/rooms
POST   /api/rooms
GET    /api/rooms/:id
PUT    /api/rooms/:id
DELETE /api/rooms/:id
POST   /api/rooms/:id/join
POST   /api/rooms/:id/leave
```

**Messages**
```
GET  /api/rooms/:id/messages
POST /api/rooms/:id/messages
PUT  /api/messages/:id
DELETE /api/messages/:id
```

#### WebSocket Events

**Connection**
```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3001');

// Join room
socket.emit('join-room', roomId);

// Listen for messages
socket.on('new-message', (message) => {
  // Handle new message
});
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📦 Build & Deploy

### Docker
```bash
# Build Docker image
docker build -t room-plus .

# Run dengan Docker Compose
docker-compose up -d
```

### Manual Deploy
```bash
# Build frontend
cd client && npm run build

# Copy build files ke server
scp -r build/* user@server:/var/www/room-plus/

# Start PM2 process
pm2 start ecosystem.config.js
```

## 🤝 Kontribusi

Kami welcome kontribusi dari community! Silakan ikuti guidelines berikut:

1. **Fork** repository ini
2. Buat **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** perubahan (`git commit -m 'Add some AmazingFeature'`)
4. **Push** ke branch (`git push origin feature/AmazingFeature`)
5. Buka **Pull Request**

### Development Guidelines
- Ikuti code style yang ada
- Tulis tests untuk feature baru
- Update documentation
- Gunakan semantic commit messages

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

- 📧 Email: support@roomplus.com
- 💬 Discord: [Room Plus Community](https://discord.gg/roomplus)
- 📖 Documentation: [docs.roomplus.com](https://docs.roomplus.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourusername/room-plus/issues)

## 🎯 Roadmap

### v1.1 (Coming Soon)
- [ ] Voice messages
- [ ] Video call integration
- [ ] Message reactions
- [ ] User status messages

### v1.2 (Future)
- [ ] File sharing improvements
- [ ] Message search
- [ ] Room analytics
- [ ] Mobile apps (iOS/Android)

### v2.0 (Long Term)
- [ ] AI chatbot integration
- [ ] Advanced moderation tools
- [ ] Enterprise features
- [ ] White-label solutions

---

<div align="center">

**Made with ❤️ by Room Plus Team**

[Website](https://roomplus.com) • [Documentation](https://docs.roomplus.com) • [Community](https://discord.gg/roomplus)

</div>