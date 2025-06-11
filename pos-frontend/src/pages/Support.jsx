import React, { useState, useEffect, useRef } from "react";
import { MdSend, MdLogout, MdWifi, MdWifiOff } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import { IoMdAttach } from "react-icons/io";
import { FaHistory } from "react-icons/fa";
import axios from "axios";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Initialize socket connection
const socket = io('http://localhost:8000', {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});

const Support = () => {
  // Customer information state
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    lastOrder: "None" // Default value
  });
  
  // Chat states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Socket states
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  
  // Form submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [formError, setFormError] = useState("");

  // Previous chat lookup state
  const [lookupPhone, setLookupPhone] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [showLookupForm, setShowLookupForm] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState(null);
  
  // End chat state
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  
  // Connection message state
  const [showConnectionMessage, setShowConnectionMessage] = useState(false);
  const connectionTimeoutRef = useRef(null);

  // Initialize socket connection handlers
  useEffect(() => {
    // Socket event handlers
    function onConnect() {
      console.log('Socket connected');
      setIsConnected(true);
      setSocketError(null);
      
      // Add connection status message to chat
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          text: "Connected to support",
          sender: "system",
          type: "connection",
          status: "connected",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      
      // Set connection message flag
      setShowConnectionMessage(true);
      // Clear previous timeout if any
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      // Hide the connection message after 5 seconds
      connectionTimeoutRef.current = setTimeout(() => {
        setShowConnectionMessage(false);
      }, 5000);
    }

    function onDisconnect() {
      console.log('Socket disconnected');
      
      if (isConnected) {
        // Only add disconnected message if we were previously connected
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            text: "Disconnected from support. Attempting to reconnect...",
            sender: "system",
            type: "connection",
            status: "disconnected",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        // Show connection status indefinitely until reconnected
        setShowConnectionMessage(true);
        // Clear any existing timeout
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      }
      
      setIsConnected(false);
    }

    function onError(error) {
      console.error('Socket error:', error);
      setSocketError(error.message || 'Connection error');
      
      // Add error message to chat
      if (isSubmitted) {
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            text: "Connection error. Trying to reconnect...",
            sender: "system",
            type: "connection",
            status: "error",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }

    function onAdminMessage(data) {
      const { message } = data;
      const newMsg = {
        id: message.id || uuidv4(),
        text: message.text,
        sender: "admin",
        time: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newMsg]);
      
      // Mark message as read
      socket.emit('customer:read', { 
        customerId, 
        messageIds: [message.id] 
      });
    }

    function onAdminTyping() {
      setIsTyping(true);
      
      // Clear typing indicator after 3 seconds
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }

    function onAdminRead() {
      // Update message read status in UI
      setMessages(prev => prev.map(msg => ({
        ...msg,
        read: true
      })));
    }

    // Set up socket event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    socket.on('error', onError);
    socket.on('admin:message', onAdminMessage);
    socket.on('admin:typing', onAdminTyping);
    socket.on('admin:read', onAdminRead);

    // Connect if customer ID is available
    if (customerId && !socket.connected) {
      socket.connect();
      
      // Authenticate after connection
      socket.on('connect', () => {
        socket.emit('customer:auth', customerId);
      });
    }

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('error', onError);
      socket.off('admin:message', onAdminMessage);
      socket.off('admin:typing', onAdminTyping);
      socket.off('admin:read', onAdminRead);
      
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(connectionTimeoutRef.current);
      
      // Important: Don't disconnect socket on unmount
      // Only disconnect when user explicitly ends chat
    };
  }, [customerId, isConnected, isSubmitted]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showConnectionMessage]);

  // Handle customer info changes
  const handleInfoChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    });
  };

  // Handle lookup phone input change
  const handleLookupPhoneChange = (e) => {
    setLookupPhone(e.target.value);
    setLookupError("");
  };

  // Look up previous chats by phone number
  const handleLookupPreviousChats = async (e) => {
    e.preventDefault();
    
    // Validate phone
    if (!lookupPhone || lookupPhone.length < 10) {
      setLookupError("Please enter a valid phone number");
      return;
    }

    setIsLookingUp(true);
    setLookupError("");
    
    try {
      const response = await api.get(`/support/lookup/${lookupPhone}`);
      
      if (response.data.success && response.data.customer) {
        setFoundCustomer(response.data.customer);
        
        // Pre-fill the form with found customer data
        setCustomerInfo({
          name: response.data.customer.name,
          email: response.data.customer.email,
          phone: response.data.customer.phone,
          lastOrder: response.data.customer.lastOrder || "None"
        });
        
        // Hide lookup form
        setShowLookupForm(false);
      } else {
        setLookupError("No previous chats found for this phone number");
      }
    } catch (error) {
      console.error("Error looking up previous chats:", error);
      setLookupError("Failed to look up previous chats");
    } finally {
      setIsLookingUp(false);
    }
  };

  // Submit customer information to start chat
  const handleStartChat = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setFormError("Please fill in all required fields");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      setFormError("Please enter a valid email address");
      return;
    }
    
    // Phone validation (basic)
    if (customerInfo.phone.length < 10) {
      setFormError("Please enter a valid phone number");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    
    try {
      // Create or get existing support customer
      const response = await api.post('/support/register', customerInfo);
      const newCustomerId = response.data.customerId;
      setCustomerId(newCustomerId);
      
      // If we found previous chats, load them
      if (foundCustomer) {
        const chatsResponse = await api.get(`/support/chats/${newCustomerId}`);
        
        if (chatsResponse.data.success && chatsResponse.data.chats) {
          // Transform the chats to match our format
          const formattedChats = chatsResponse.data.chats.map((chat) => ({
            id: chat.id,
            text: chat.text,
            sender: chat.sender === "customer" ? "user" : "admin",
            time: new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: chat.read
          }));
          
          setMessages(formattedChats);
        } else {
          // Set welcome message if no previous chats found
          setMessages([
            { 
              id: uuidv4(), 
              text: `Welcome back, ${customerInfo.name}! How can we help you today?`, 
              sender: "admin", 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: true
            }
          ]);
        }
      } else {
        // Set initial welcome message for new customers
        setMessages([
          { 
            id: uuidv4(), 
            text: `Welcome ${customerInfo.name}! How can we help you today?`, 
            sender: "admin", 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: true
          }
        ]);
      }
      
      setIsSubmitted(true);
      
      // Connect to socket server
      if (!socket.connected) {
        socket.connect();
        
        // Once connected, authenticate
        socket.on('connect', () => {
          socket.emit('customer:auth', newCustomerId);
        });
      } else {
        socket.emit('customer:auth', newCustomerId);
      }
      
    } catch (error) {
      console.error("Error starting support chat:", error);
      setFormError("Unable to start chat. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle typing indication
  const handleTyping = () => {
    if (socket.connected && customerId) {
      socket.emit('customer:typing', customerId);
    }
  };

  // Send message from customer
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !customerId || !socket.connected) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = uuidv4();
    
    // Add message to local state immediately with pending status
    const messageObj = {
      id: tempId,
      text: newMessage,
      sender: "user",
      time: timeString,
      pending: true
    };
    
    setMessages(prev => [...prev, messageObj]);
    setNewMessage("");
    
    // Emit message to server via socket
    socket.emit('customer:message', {
      customerId,
      message: newMessage
    });

    // Listen for message confirmation
    const onMessageSent = (data) => {
      // Update the message in state with server-generated ID
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, id: data.messageId, pending: false } : msg
      ));
      
      // Remove the listener after handling
      socket.off('message:sent', onMessageSent);
    };

    // Handle potential errors
    const onSendError = (error) => {
      console.error("Error sending message:", error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, pending: false, failed: true } : msg
      ));
      
      // Remove the listener
      socket.off('error', onSendError);
    };

    // Add temporary listeners
    socket.on('message:sent', onMessageSent);
    socket.on('error', onSendError);
  };

  // Toggle lookup form
  const toggleLookupForm = () => {
    setShowLookupForm(prev => !prev);
    setLookupError("");
    setLookupPhone("");
  };

  // Retry sending failed message
  const retryMessage = (failedMsgId) => {
    const failedMsg = messages.find(msg => msg.id === failedMsgId);
    if (!failedMsg) return;
    
    // Remove failed message
    setMessages(prev => prev.filter(msg => msg.id !== failedMsgId));
    
    // Set the message text back in the input
    setNewMessage(failedMsg.text);
  };
  
  // End chat and disconnect from support
  const handleEndChat = async () => {
    setIsEndingChat(true);
    
    try {
      // Tell the server this chat is ended
      if (socket.connected && customerId) {
        socket.emit('customer:end-chat', { customerId });
      }
      
      // Add a system message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        text: "Chat has ended. Thank you for contacting our support team.",
        sender: "system",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      
      // Update chat status on server
      await api.put(`/support/customers/${customerId}/status`, { status: 'resolved' });

      // Disconnect socket after confirming end of chat
      setTimeout(() => {
        socket.disconnect();
        setIsEndingChat(false);
        setShowEndChatConfirm(false);
        
        // Redirect to feedback page or home page after a delay
        // setTimeout(() => window.location.href = "/", 3000);
      }, 1000);
      
    } catch (error) {
      console.error("Error ending chat:", error);
      setIsEndingChat(false);
      setShowEndChatConfirm(false);
      
      // Disconnect anyway
      socket.disconnect();
    }
  };

  return (
    <div className="flex flex-col h-[calc(95vh-40px)] bg-[#1a1a1a] custom-scrollbar-hidden">
      {/* Header */}
      <div className="bg-[#262626] p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
              S
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full border-2 border-[#262626]`}></div>
          </div>
          <div className="ml-4">
            <h2 className="text-white font-medium">Customer Support</h2>
            <p className="text-[#ababab] text-sm">
              {isConnected ? "Connected" : "Connecting..."}
            </p>
          </div>
        </div>
        
        {/* End Chat button - only shown when chat is active */}
        {isSubmitted && (
          <button 
            onClick={() => setShowEndChatConfirm(true)} 
            disabled={isEndingChat}
            className="flex items-center px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-md text-sm transition-colors"
          >
            <MdLogout className="mr-1" /> End Chat
          </button>
        )}
        
        {socketError && (
          <div className="px-3 py-1 bg-red-900/50 border border-red-800 rounded text-red-400 text-xs">
            {socketError}
          </div>
        )}
      </div>

      {/* Registration form or chat area */}
      {!isSubmitted ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#262626] rounded-lg shadow-lg p-6">
            {!showLookupForm ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Start a Support Chat</h2>
                  <button
                    onClick={toggleLookupForm}
                    className="flex items-center text-sm bg-[#323232] hover:bg-[#3a3a3a] text-[#ababab] px-3 py-1 rounded-md transition-colors"
                  >
                    <FaHistory className="mr-1" /> Load Previous Chat
                  </button>
                </div>
                <p className="text-[#ababab] mb-6">Please fill in your details to get started</p>
                
                {foundCustomer && (
                  <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded text-green-400 text-sm">
                    Previous chat found! We've filled in your details.
                  </div>
                )}
                
                {formError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                    {formError}
                  </div>
                )}
                
                <form onSubmit={handleStartChat}>
                  <div className="mb-4">
                    <label className="block text-[#ababab] text-sm mb-2" htmlFor="name">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInfoChange}
                      className="w-full bg-[#323232] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F6B100]"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-[#ababab] text-sm mb-2" htmlFor="email">
                      Email Address*
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleInfoChange}
                      className="w-full bg-[#323232] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F6B100]"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-[#ababab] text-sm mb-2" htmlFor="phone">
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInfoChange}
                      className="w-full bg-[#323232] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F6B100]"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-[#ababab] text-sm mb-2" htmlFor="lastOrder">
                      Last Order ID (if applicable)
                    </label>
                    <input
                      type="text"
                      id="lastOrder"
                      name="lastOrder"
                      value={customerInfo.lastOrder}
                      onChange={handleInfoChange}
                      className="w-full bg-[#323232] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F6B100]"
                      placeholder="Order ID (optional)"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      isSubmitting 
                        ? "bg-[#7d5c00] text-[#d4d4d4] cursor-not-allowed" 
                        : "bg-[#F6B100] text-[#1a1a1a] hover:bg-[#e5a602]"
                    }`}
                  >
                    {isSubmitting ? "Starting Chat..." : "Start Chat"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Load Previous Chat</h2>
                  <button
                    onClick={toggleLookupForm}
                    className="text-sm bg-[#323232] hover:bg-[#3a3a3a] text-[#ababab] px-3 py-1 rounded-md transition-colors"
                  >
                    Back to Registration
                  </button>
                </div>
                <p className="text-[#ababab] mb-6">Enter your phone number to find previous chats</p>
                
                {lookupError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                    {lookupError}
                  </div>
                )}
                
                <form onSubmit={handleLookupPreviousChats} className="mb-4">
                  <div className="mb-4">
                    <label className="block text-[#ababab] text-sm mb-2" htmlFor="lookupPhone">
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      id="lookupPhone"
                      value={lookupPhone}
                      onChange={handleLookupPhoneChange}
                      className="w-full bg-[#323232] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F6B100]"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLookingUp}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      isLookingUp 
                        ? "bg-[#7d5c00] text-[#d4d4d4] cursor-not-allowed" 
                        : "bg-[#F6B100] text-[#1a1a1a] hover:bg-[#e5a602]"
                    }`}
                  >
                    {isLookingUp ? "Looking up..." : "Find Previous Chats"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Chat area - Add custom-scrollbar-hidden class */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-hidden">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${
                  message.sender === "system" 
                    ? "justify-center" 
                    : message.sender === "user" 
                      ? "justify-end" 
                      : "justify-start"
                }`}
              >
                {message.sender === "system" ? (
                  message.type === "connection" ? (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                      message.status === "connected" 
                        ? "bg-green-900/30 text-green-400 border border-green-800" 
                        : message.status === "disconnected"
                          ? "bg-red-900/30 text-red-400 border border-red-800"
                          : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                    }`}>
                      {message.status === "connected" ? (
                        <MdWifi className="text-green-400" />
                      ) : (
                        <MdWifiOff className="text-red-400" />
                      )}
                      {message.text}
                    </div>
                  ) : (
                    <div className="max-w-[80%] rounded-md bg-gray-800/40 border border-gray-700 p-3 px-4 text-center text-gray-300 text-sm">
                      {message.text}
                    </div>
                  )
                ) : (
                  <div 
                    className={`max-w-[80%] rounded-2xl p-3 px-4 ${
                      message.sender === "user" 
                        ? message.failed 
                          ? "bg-red-800/40 text-white border border-red-700" 
                          : message.pending 
                            ? "bg-[#5a4000] text-[#f0f0f0]" 
                            : "bg-[#F6B100] text-[#1a1a1a]"
                        : "bg-[#323232] text-white"
                    }`}
                  >
                    <p>{message.text}</p>
                    <div className="flex justify-between items-center mt-1 text-xs">
                      <span className={`${
                        message.sender === "user" 
                          ? message.failed 
                            ? "text-red-400 cursor-pointer hover:underline" 
                            : message.pending 
                              ? "text-[#d4d4d4]" 
                              : "text-[#664c00]"
                          : "text-[#ababab]"
                      }`}>
                        {message.failed 
                          ? <span onClick={() => retryMessage(message.id)}>Failed - Click to retry</span>
                          : message.pending 
                            ? "Sending..."
                            : message.time}
                      </span>
                      
                      {message.sender === "user" && !message.pending && !message.failed && (
                        <span className="ml-1">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            fill="currentColor" 
                            viewBox="0 0 16 16" 
                            className={message.read ? "text-blue-500" : "text-[#664c00]"}
                          >
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#323232] rounded-2xl p-3 px-4">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Floating connection status - shows at bottom of chat */}
            {showConnectionMessage && !isConnected && (
              <div className="sticky bottom-0 left-0 right-0 mb-2">
                <div className="flex justify-center">
                  <div className="bg-red-900/80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg animate-pulse">
                    <MdWifiOff /> Reconnecting to support...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messageEndRef} />
          </div>

          {/* Connection status bar - persistent when disconnected */}
          {!isConnected && (
            <div className="bg-[#262626] px-4 py-2 text-yellow-500 text-sm flex items-center justify-center gap-2 border-t border-[#333]">
              <div className="animate-ping w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
              Connecting to support system... Messages will be delivered when connection is restored.
            </div>
          )}

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#262626] flex items-center">
            <button 
              type="button"
              className="p-2 text-[#ababab] hover:text-white transition-colors"
              disabled={!isConnected || isEndingChat}
            >
              <IoMdAttach size={24} className={!isConnected || isEndingChat ? "opacity-50" : ""} />
            </button>
            <div className="flex-1 mx-2 bg-[#323232] rounded-full px-4 py-2 relative">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleTyping}
                placeholder="Type a message..."
                className="w-full bg-transparent text-white focus:outline-none"
                disabled={isEndingChat}
              />
              {/* Connection indicator inside the input field */}
              {isSubmitted && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              )}
            </div>
            <button 
              type="button"
              className="p-2 text-[#ababab] hover:text-white transition-colors"
              disabled={!isConnected || isEndingChat}
            >
              <BsEmojiSmile size={20} className={!isConnected || isEndingChat ? "opacity-50" : ""} />
            </button>
            <button 
              type="submit"
              disabled={!newMessage.trim() || !isConnected || isEndingChat}
              className={`ml-2 p-2 rounded-full ${
                newMessage.trim() && isConnected && !isEndingChat
                  ? "bg-[#F6B100] text-white" 
                  : "bg-[#3a3a3a] text-[#6a6a6a]"
              }`}
              title={!isConnected ? "Waiting for connection..." : isEndingChat ? "Chat ending..." : ""}
            >
              <MdSend size={20} />
            </button>
          </form>
        </>
      )}
      
      {/* End Chat Confirmation Modal */}
      {showEndChatConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#262626] rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">End Support Chat?</h3>
            <p className="text-[#ababab] mb-6">
              Are you sure you want to end this chat session? You can always start a new chat later.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEndChatConfirm(false)}
                disabled={isEndingChat}
                className="px-5 py-2 rounded-md text-white bg-[#323232] hover:bg-[#3a3a3a]"
              >
                Cancel
              </button>
              <button
                onClick={handleEndChat}
                disabled={isEndingChat}
                className={`px-5 py-2 rounded-md ${
                  isEndingChat
                    ? "bg-red-900/60 text-red-300/70 cursor-not-allowed"
                    : "bg-red-700 text-white hover:bg-red-600"
                }`}
              >
                {isEndingChat ? "Ending..." : "End Chat"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
        }
        
        .typing-indicator span {
          height: 8px;
          width: 8px;
          margin: 0 2px;
          background-color: #ababab;
          display: block;
          border-radius: 50%;
          opacity: 0.4;
          animation: typing 1s infinite;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.6s;
        }
        
        @keyframes typing {
          0% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.4; transform: scale(1); }
        }
        
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes ping {
          0% { transform: scale(0.8); opacity: 1; }
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        
        /* Hide scrollbar for all browsers while maintaining scroll functionality */
        .custom-scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        
        .custom-scrollbar-hidden {
          -ms-overflow-style: none; /* Hides the scrollbar in Internet Explorer */
          scrollbar-width: none; /* Hides the scrollbar in Firefox */
        }
      `}</style>
    </div>
  );
};

export default Support;