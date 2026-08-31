const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // Join personal user notification room
    socket.on('join_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('leave_room', (userId) => {
      if (userId) {
        socket.leave(`user_${userId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

const emitNotificationToUser = (userId, notificationData) => {
  if (io) {
    io.to(`user_${userId.toString()}`).emit('new_notification', notificationData);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitNotificationToUser
};
