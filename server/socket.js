// server/socket.js
const { Server } = require('socket.io');

let io;

function init(httpServer, origin) {
  io = new Server(httpServer, {
    cors: {
      origin: origin || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
    transports: ['websocket', 'polling'], // bật fallback
    // allowEIO3: true, // bật nếu client là v3
  });

  io.on('connection', (socket) => {
    // FE nên emit: socket.emit('register', { userId })
    socket.on('register', ({ userId }) => {
      if (userId) socket.join(String(userId));
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(String(userId)).emit(event, payload);
}

module.exports = { init, getIO, emitToUser };
