import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = uuidv4();
    
    // Add default properties
    const fullNotification = {
      id,
      title: notification.title || 'Notification',
      message: notification.message,
      type: notification.type || 'info', // 'success', 'error', 'warning', 'info'
      duration: notification.duration || 3000, // default 3 seconds
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, fullNotification]);
    
    // Auto-dismiss notification after duration
    if (fullNotification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, fullNotification.duration);
    }
    
    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};