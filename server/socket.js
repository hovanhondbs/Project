// server/socket.js
const { Server } = require('socket.io');

let io = null;
const userRoom = (userId) => `user:${userId}`;

function initSocket(server, opts = {}) {
  io = new Server(server, {
    cors: {
      origin: opts.origin || '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    // Client gửi: socket.emit('register', { userId })
    socket.on('register', ({ userId }) => {
      if (!userId) return;
      const uid = String(userId);
      socket.data.userId = uid;
      socket.join(userRoom(uid));
    });

    socket.on('disconnect', () => {
      // cleanup tự động do join room theo socket
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
  getIO().to(userRoom(String(userId))).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToUser, userRoom };
