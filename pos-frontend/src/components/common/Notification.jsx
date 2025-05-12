import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfo } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';

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
    <div className="fixed top-0 right-0 z-50 p-4 w-full md:w-96 space-y-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded shadow-lg p-4 text-white flex items-start pointer-events-auto ${getNotificationClass(notification.type)}`}
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