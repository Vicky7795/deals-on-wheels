import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [latestNotification, setLatestNotification] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const socketInstance = io('/', {
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('join_room', user._id);
      });

      socketInstance.on('new_notification', (notification) => {
        setLatestNotification(notification);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.emit('leave_room', user._id);
        socketInstance.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, latestNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
