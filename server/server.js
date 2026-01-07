const { server } = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('====================================');
  console.log(`🚀 ROOM PLUS Server v1.0.0`);
  console.log('====================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log('====================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\ud83d\udcdd SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\ud83d\udcdd SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});