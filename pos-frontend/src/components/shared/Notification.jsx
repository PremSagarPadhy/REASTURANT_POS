import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfo } from 'react-icons/fa';
import { useNotification } from '../../context/NotificationContext';

const Notification = () => {
  const { notifications, dismissNotification } = useNotification();

  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheck />;
      case 'error':
        return <FaTimes />;
      case 'warning':
        return <FaExclamationTriangle />;
      case 'info':
      default:
        return <FaInfo />;
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`rounded-md shadow-lg p-4 text-white flex items-start pointer-events-auto ${getNotificationClass(notification.type)}`}
          >
            <div className="flex-shrink-0 mr-2 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-grow">
              <p className="font-semibold">{notification.title}</p>
              <p className="text-sm">{notification.message}</p>
            </div>
            <button 
              onClick={() => dismissNotification(notification.id)}
              className="ml-3 flex-shrink-0 mt-0.5 text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close notification"
            >
              <FaTimes />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notification;