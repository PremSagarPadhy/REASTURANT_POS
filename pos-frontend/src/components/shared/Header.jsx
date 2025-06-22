import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaUserCircle, FaBell } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { PiHouseSimpleFill } from "react-icons/pi";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const API_URL = import.meta.env.PROD 
  ? 'https://reasturant-pos-backend.onrender.com/api'
  : 'http://localhost:8000/api';

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New order received from Table 3", time: "10 mins ago", isRead: false },
    { id: 2, message: "Customer requested assistance at Table 5", time: "25 mins ago", isRead: false },
    { id: 3, message: "Payment completed for Order #1234", time: "1 hour ago", isRead: true },
  ]);
  
  const notificationRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    // Only connect if the user is logged in
    if (userData.token) {
      // Connect to the WebSocket server
      socketRef.current = io('https://reasturant-pos-backend.onrender.com', {
        withCredentials: true
      });

      // Handle connection
      socketRef.current.on('connect', () => {
        console.log('Connected to notification socket');
        
        // Authenticate as admin if applicable
        if (userData.role === 'Admin') {
          socketRef.current.emit('admin:auth', userData.id);
        }
      });

      // Listen for new customer messages (for admins)
      if (userData.role === 'Admin') {
        // New customer message notification
        socketRef.current.on('customer:message', (data) => {
          const { customerId, message } = data;
          addNotification(`New support message from customer #${customerId.substring(0, 6)}`, message.text);
        });

        // Customer came online
        socketRef.current.on('customer:online', (customerId) => {
          addNotification('Customer Online', `Customer #${customerId.substring(0, 6)} is now online`);
        });
      }

      // Listen for support status updates (for both admin and customers)
      socketRef.current.on('support:status', (data) => {
        const { status } = data;
        if (status === 'resolved') {
          addNotification('Support Case Resolved', 'A support conversation has been resolved');
        }
      });

      // Order notifications - for new orders and order status updates
      socketRef.current.on('new:order', (orderData) => {
        // Play notification sound for new orders
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        // Add visual notification with customer details
        addNotification(
          'New Order Received', 
          `Order #${orderData.orderId.substring(0, 6)} from ${orderData.source}${orderData.customerName ? ` (${orderData.customerName})` : ''}`
        );
      });

      socketRef.current.on('order:update', (orderData) => {
        // For important status changes like "Ready" or "Completed", you might want a different notification style
        const isImportantUpdate = ['Ready', 'Completed'].includes(orderData.status);
        
        if (isImportantUpdate) {
          // Play a different sound for important updates
          const audio = new Audio('/status-change-sound.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
        
        addNotification(
          `Order ${orderData.status}`, 
          `Order #${orderData.orderId.substring(0, 6)} status changed to ${orderData.status}${orderData.customerName ? ` (${orderData.customerName})` : ''}`
        );
      });

      // Clean up on component unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [userData.token, userData.id, userData.role]);

  // Enhance the getTimeString function to show relative time
  const getTimeString = () => {
    // For a more sophisticated time display, you could use a library like date-fns
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add a new notification
  const addNotification = (message, details = '') => {
    const newNotification = {
      id: Date.now(),
      message: message,
      details: details,
      time: getTimeString(),
      isRead: false,
    };

    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
  };

  // Handle click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      console.log(data);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (id) => {
    setNotifications(
      notifications.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <>
      <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a] relative">
        {/* LOGO - Hidden on Dashboard */}
        {location.pathname !== "/dashboard" ? (
          <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
            <img src={logo} className="h-8 w-8" alt="restro logo" />
            <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
              Restro-Maniac
            </h1>
          </div>
        ) : (
          <div className="w-16"></div> // Keeps search bar centered
        )}

        {/* SEARCH (Position Unchanged) */}
        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-5 py-2 w-[500px]">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Search"
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
          />
        </div>

        {/* LOGGED USER DETAILS */}
        <div className="flex items-center gap-4">
          {userData.role === "Admin" && (
            <div
              onClick={() => navigate("/dashboard")}
              className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer"
            >
              <MdDashboard className="text-[#f5f5f5] text-2xl" />
            </div>
          )}

          {/* Show Menu Icon Only on Dashboard */}
          {location.pathname === "/dashboard" && (
            <button
              onClick={() => navigate("/")}
              className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer"
            >
              <PiHouseSimpleFill className="text-[#f5f5f5] text-2xl" />
            </button>
          )}

          {/* Notification Bell with Counter */}
          <div className="relative" ref={notificationRef}>
            <div 
              onClick={toggleNotifications}
              className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer relative"
            >
              <FaBell className="text-[#f5f5f5] text-2xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {unreadCount}
                </span>
              )}
            </div>
            
            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1f1f1f] rounded-md shadow-lg z-10">
                <div className="p-3 border-b border-[#333333] flex justify-between items-center">
                  <h3 className="text-[#f5f5f5] font-semibold">Notifications</h3>
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-[#f5f5f5] hover:text-blue-400"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 border-b border-[#333333] hover:bg-[#2a2a2a] cursor-pointer ${
                          !notification.isRead ? 'bg-[#2a2a2a]' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex justify-between">
                          <p className="text-sm text-[#f5f5f5]">{notification.message}</p>
                          {!notification.isRead && (
                            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        {notification.details && (
                          <p className="text-xs text-[#d1d1d1] mt-1 truncate">{notification.details}</p>
                        )}
                        <p className="text-xs text-[#ababab] mt-1">{notification.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[#ababab]">No notifications</div>
                  )}
                </div>
                <div className="p-2 border-t border-[#333333] text-center">
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 cursor-pointer">
            <FaUserCircle className="text-[#f5f5f5] text-4xl" />
            <div className="flex flex-col items-start">
              <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
                {userData.name || "TEST USER"}
              </h1>
              <p className="text-xs text-[#ababab] font-medium">
                {userData.role || "Role"}
              </p>
            </div>
            <IoLogOut
              onClick={handleLogout}
              className="text-[#f5f5f5] ml-2"
              size={40}
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
