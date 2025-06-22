import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.PROD 
  ? 'https://reasturant-pos-backend.onrender.com/api'
  : 'http://localhost:8000/api';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const userData = useSelector((state) => state.user);
  
  // Initialize socket connection
  useEffect(() => {
    // Only connect if the user is logged in
    if (userData?.token) {
      console.log('Initializing socket connection for notifications');
      
      // Connect to the WebSocket server - MAKE SURE PORT MATCHES BACKEND
      socketRef.current = io(`${API_URL}`, {
        withCredentials: true
      });

      // Handle connection
      socketRef.current.on('connect', () => {
        console.log('Connected to notification socket with ID:', socketRef.current.id);
        
        // Authenticate based on user role
        if (userData.role === 'Admin') {
          socketRef.current.emit('admin:auth', userData.id);
        }
      });

      // Connection error handling
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        addNotification('Connection Error', 'Unable to connect to notification server', 'error');
      });

      // Set up notification listeners based on user role
      setupNotificationListeners();

      // Clean up on component unmount
      return () => {
        if (socketRef.current) {
          console.log('Disconnecting notification socket');
          socketRef.current.disconnect();
        }
      };
    }
  }, [userData?.token, userData?.id, userData?.role]);

  const setupNotificationListeners = () => {
    if (!socketRef.current) return;

    // Common notifications
    socketRef.current.on('new:order', (orderData) => {
      console.log('New order received via socket:', orderData); // Debug log
      addNotification('New Order', `Order #${orderData.orderId} received from ${orderData.source}`);
      
      // Play sound for new orders
      try {
        const audio = new Audio('/sounds/notification-sound.mp3');
        audio.volume = 0.5; // 50% volume
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    });

    socketRef.current.on('order:update', (orderData) => {
      addNotification('Order Updated', `Order #${orderData.orderId} status changed to ${orderData.status}`);
      
      // Play sound for important status changes
      if (['Ready', 'Completed'].includes(orderData.status)) {
        try {
          const audio = new Audio('/sounds/status-change-sound.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
          console.error('Error playing status change sound:', error);
        }
      }
    });

    // Role-specific notifications
    if (userData?.role === 'Admin') {
      socketRef.current.on('customer:message', (data) => {
        const { customerId, message } = data;
        addNotification('New Support Message', message.text, 'warning');
        
        // Play notification sound for support messages
        try {
          const audio = new Audio('/sounds/notification-sound.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
      });

      socketRef.current.on('customer:online', (customerId) => {
        addNotification('Customer Online', `Customer #${customerId.substring(0, 6)} is now online`, 'info');
      });
    }

    // Support status updates (for both admin and customers)
    socketRef.current.on('support:status', (data) => {
      const { status } = data;
      if (status === 'resolved') {
        addNotification('Support Case Resolved', 'A support conversation has been resolved', 'success');
      }
    });
  };

  const addNotification = (title, message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date(),
      isRead: false
    };

    setNotifications(prevNotifications => {
      // Add to the beginning of the array (newest first)
      const updatedNotifications = [newNotification, ...prevNotifications];
      
      // Limit to 50 notifications to prevent excessive memory usage
      if (updatedNotifications.length > 50) {
        return updatedNotifications.slice(0, 50);
      }
      return updatedNotifications;
    });
    
    // Auto-dismiss notification after 5 seconds
    setTimeout(() => {
      dismissNotification(newNotification.id);
    }, 5000);
    
    return newNotification.id;
  };

  const dismissNotification = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const markAsRead = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    socketRef
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};