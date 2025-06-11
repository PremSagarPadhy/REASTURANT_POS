import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaEllipsisV, FaSearch, FaCommentAlt } from "react-icons/fa";
import { MdClose, MdSend, MdCheck, MdMarkChatRead, MdWifi, MdWifiOff } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { io } from "socket.io-client"; // Import socket.io-client

// Create API service for support endpoints
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Support API functions
const fetchCustomers = () => api.get('/support/customers');
const sendMessageApi = (data) => api.post('/support/messages', data);
const markAsReadApi = (customerId) => api.put(`/support/customers/${customerId}/read`);
const updateStatusApi = (customerId, status) => api.put(`/support/customers/${customerId}/status`, { status });

// Initialize socket connection
const socket = io('http://localhost:8000', {
  withCredentials: true,
  autoConnect: false
});

const AdminSupport = ({ isEmbedded = false }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showChatModal, setShowChatModal] = useState(false);
  const messageEndRef = useRef(null);
  const queryClient = useQueryClient();
  
  // Socket connection state
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Connection message state
  const [showConnectionMessage, setShowConnectionMessage] = useState(false);
  const connectionTimeoutRef = useRef(null);
  
  // Initialize socket connection
  useEffect(() => {
    // Connect to socket
    if (!socket.connected) {
      socket.connect();
    }
    
    // Socket event handlers
    function onConnect() {
      setIsConnected(true);
      setSocketError(null);
      console.log('Connected to support socket');
      
      // Show connection status briefly
      setShowConnectionMessage(true);
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = setTimeout(() => {
        setShowConnectionMessage(false);
      }, 5000);
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('Disconnected from support socket');
      
      // Show disconnection status indefinitely
      setShowConnectionMessage(true);
      clearTimeout(connectionTimeoutRef.current);
    }

    function onError(error) {
      setSocketError('Connection error. Trying to reconnect...');
      console.error('Socket error:', error);
      
      // Show error status
      setShowConnectionMessage(true);
      clearTimeout(connectionTimeoutRef.current);
    }
    
    // Handle customer messages through socket
    function onCustomerMessage(data) {
      // If this is from the currently selected customer, mark as read
      if (selectedCustomer === data.customerId) {
        markAsReadMutation.mutate(selectedCustomer);
      }
      
      // Update the customer list with the new message
      queryClient.invalidateQueries(['support', 'customers']);
      
      // Show notification if not viewing this customer
      if (selectedCustomer !== data.customerId) {
        enqueueSnackbar(`New message from ${data.customerName || 'Customer'}`, { 
          variant: "info",
          preventDuplicate: true
        });
      }
    }
    
    // Handle typing indicator from customer
    function onCustomerTyping(data) {
      if (selectedCustomer === data.customerId) {
        setIsTyping(true);
        
        // Clear previous timeout if exists
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to clear typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    }

    // Set up socket event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    socket.on('error', onError);
    socket.on('customer:message', onCustomerMessage);
    socket.on('customer:typing', onCustomerTyping);

    // Emit admin-connected event
    socket.emit('admin:connected');
    
    // Cleanup function
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('error', onError);
      socket.off('customer:message', onCustomerMessage);
      socket.off('customer:typing', onCustomerTyping);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [queryClient, selectedCustomer]);

  // Join specific customer room when selected
  useEffect(() => {
    if (selectedCustomer && isConnected) {
      // Leave any previous rooms
      socket.emit('admin:leave-all-rooms');
      
      // Join the room for the selected customer
      socket.emit('admin:join-room', { customerId: selectedCustomer });
      
      // Emit read event for this customer
      socket.emit('admin:read', { customerId: selectedCustomer });
    }
  }, [selectedCustomer, isConnected]);
  
  // Fetch customers data with React Query
  const { data: customersData, isLoading, isError } = useQuery({
    queryKey: ['support', 'customers'],
    queryFn: fetchCustomers,
    refetchInterval: 30000, // Fallback refetch every 30 seconds
    select: (response) => response.data.data || [],
    onError: (error) => {
      console.error('Error fetching customers:', error);
      enqueueSnackbar("Failed to load support data", { variant: "error" });
    }
  });
  
  // Use customers data from the query or fallback to empty array
  const customers = customersData || [];
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessageApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['support', 'customers']);
      
      // Also emit the message via socket for real-time delivery
      if (isConnected) {
        socket.emit('admin:message', {
          customerId: variables.customerId, 
          message: variables.message
        });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      enqueueSnackbar("Failed to send message", { variant: "error" });
    }
  });
  
  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (customerId) => markAsReadApi(customerId),
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries(['support', 'customers']);
      
      // Emit read status via socket
      if (isConnected) {
        socket.emit('admin:read', { customerId });
      }
    },
    onError: (error) => {
      console.error('Error marking messages as read:', error);
    }
  });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ customerId, status }) => updateStatusApi(customerId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['support', 'customers']);
      
      // Notify via socket about status change
      if (isConnected) {
        socket.emit('admin:status-change', { 
          customerId: variables.customerId,
          status: variables.status 
        });
      }
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      enqueueSnackbar("Failed to update customer status", { variant: "error" });
    }
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current && showChatModal) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedCustomer, showChatModal, customers, isTyping, showConnectionMessage]);

  // When a customer is selected, mark their messages as read
  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer && customer.unreadCount > 0) {
        markAsReadMutation.mutate(selectedCustomer);
      }
    }
  }, [selectedCustomer, customers]);

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display in the table
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle typing indication
  const handleTyping = () => {
    if (isConnected && selectedCustomer) {
      socket.emit('admin:typing', { customerId: selectedCustomer });
    }
  };

  // Handle sending a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCustomer) return;
    
    sendMessageMutation.mutate({
      customerId: selectedCustomer,
      message: newMessage
    });
    
    setNewMessage("");
  };

  // Handle customer selection for chat
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomer(customerId);
    setShowChatModal(true);
  };

  // Handle closing the chat modal
  const handleCloseChat = () => {
    setShowChatModal(false);
    // Leave customer room when closing chat
    if (isConnected && selectedCustomer) {
      socket.emit('admin:leave-room', { customerId: selectedCustomer });
    }
  };

  // Toggle customer status between active and resolved
  const toggleCustomerStatus = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newStatus = customer.status === "active" ? "resolved" : "active";
      updateStatusMutation.mutate({ customerId, status: newStatus });
    }
  };

  // Filter customers based on search term and active filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
      
    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "active") return matchesSearch && customer.status === "active";
    if (activeFilter === "resolved") return matchesSearch && customer.status === "resolved";
    if (activeFilter === "unread") return matchesSearch && customer.unreadCount > 0;
    
    return matchesSearch;
  });

  // Get the currently selected customer's data
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className={`${isEmbedded ? "fixed inset-0" : "absolute top-16 left-0 right-0 bottom-0"} w-full flex bg-[#1a1a1a]`}>
      {/* Main content area with customer table */}
      <div className="flex-1 p-4">
        {/* Search and filter bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-md">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-[#F6B100]"
            />
            <FaSearch className="absolute left-3 top-3.5 text-[#6a6a6a]" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-md ${activeFilter === "all" ? "bg-[#F6B100] text-black" : "bg-[#2a2a2a] text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("active")}
              className={`px-4 py-2 rounded-md ${activeFilter === "active" ? "bg-[#F6B100] text-black" : "bg-[#2a2a2a] text-white"}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-4 py-2 rounded-md ${activeFilter === "unread" ? "bg-[#F6B100] text-black" : "bg-[#2a2a2a] text-white"}`}
            >
              Unread
            </button>
            <button
              onClick={() => setActiveFilter("resolved")}
              className={`px-4 py-2 rounded-md ${activeFilter === "resolved" ? "bg-[#F6B100] text-black" : "bg-[#2a2a2a] text-white"}`}
            >
              Resolved
            </button>
          </div>
        </div>
        
        {/* Show loading state */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <motion.div 
              animate={{ 
                rotate: 360,
                transition: { 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                } 
              }}
              className="rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F6B100]"
            ></motion.div>
          </div>
        )}
        
        {/* Show error state */}
        {isError && (
          <div className="text-center py-10 text-red-400">
            <p>Failed to load support data. Please try again later.</p>
            <button 
              onClick={() => queryClient.invalidateQueries(['support', 'customers'])}
              className="mt-4 px-4 py-2 bg-[#2a2a2a] rounded-md hover:bg-[#333] text-white"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Customers table */}
        {!isLoading && !isError && (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full text-sm text-left text-[#f5f5f5] border-spacing-0">
              <thead className="text-xs uppercase bg-[#2a2a2a] text-[#f5f5f5]">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Last Order</th>
                  <th className="px-6 py-4">Date Joined</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 rounded-tr-lg text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr 
                    key={customer.id}
                    className={`border-b border-[#333] ${index % 2 === 0 ? 'bg-[#222]' : 'bg-[#1f1f1f]'} hover:bg-[#2a2a2a]`}
                  >
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#F6B100] rounded-full flex items-center justify-center text-black font-bold mr-3">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">{customer.name}</div>
                          <div className="text-[#999] text-xs mt-1">{customer.lastActive}</div>
                        </div>
                        {customer.unreadCount > 0 && (
                          <span className="ml-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {customer.unreadCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{customer.email}</div>
                      <div className="text-xs text-[#999] mt-1">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#333] px-3 py-1 rounded text-xs">
                        {customer.lastOrder}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(customer.dateJoined)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        customer.status === 'active' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-4">
                        <button 
                          onClick={() => handleCustomerSelect(customer.id)}
                          className="p-2 bg-[#1a1a1a] rounded-md hover:bg-[#333] transition-colors"
                          title="Open chat"
                        >
                          <FaCommentAlt size={16} className="text-[#F6B100]" />
                        </button>
                        <button 
                          onClick={() => toggleCustomerStatus(customer.id)}
                          className="p-2 bg-[#1a1a1a] rounded-md hover:bg-[#333] transition-colors"
                          title={customer.status === 'active' ? "Mark as resolved" : "Mark as active"}
                        >
                          {customer.status === 'active' ? (
                            <MdCheck size={18} className="text-green-500" />
                          ) : (
                            <MdMarkChatRead size={18} className="text-gray-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#999]">
                      No customers found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Chat Modal - shows when a customer is selected */}
      <AnimatePresence>
        {showChatModal && selectedCustomerData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="bg-[#1a1a1a] rounded-lg shadow-xl w-full max-w-md h-[80vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Chat header */}
              <div className="bg-[#262626] p-4 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#F6B100] rounded-full flex items-center justify-center text-black font-bold mr-3">
                    {selectedCustomerData.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedCustomerData.name}</h3>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        selectedCustomerData.lastActive === 'Just now' || 
                        selectedCustomerData.lastActive.includes('min') 
                          ? 'bg-green-500' 
                          : 'bg-gray-500'
                      }`}></span>
                      <span className="text-xs text-[#ababab]">{selectedCustomerData.lastActive}</span>
                      {isTyping && <span className="text-xs text-green-400 ml-2">typing...</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <button 
                    onClick={() => toggleCustomerStatus(selectedCustomerData.id)}
                    className="p-1.5 mr-2 bg-[#1a1a1a] rounded-md hover:bg-[#333]"
                    title={selectedCustomerData.status === 'active' ? "Mark as resolved" : "Reopen chat"}
                  >
                    {selectedCustomerData.status === 'active' ? (
                      <MdCheck size={18} className="text-green-500" />
                    ) : (
                      <MdMarkChatRead size={18} className="text-gray-500" />
                    )}
                  </button>
                  
                  <button 
                    onClick={handleCloseChat}
                    className="p-1.5 bg-[#1a1a1a] rounded-md hover:bg-[#333]"
                  >
                    <MdClose size={18} className="text-[#ababab]" />
                  </button>
                </div>
              </div>
              
              {/* Connection status banner inside chat - only shown when connected/disconnected */}
              {showConnectionMessage && (
                <div className={`flex items-center justify-center py-2 px-4 ${
                  isConnected 
                    ? "bg-green-900/20 border-b border-green-900" 
                    : "bg-red-900/20 border-b border-red-900"
                }`}>
                  <div className={`flex items-center gap-2 text-sm ${
                    isConnected ? "text-green-400" : "text-red-400"
                  }`}>
                    {isConnected 
                      ? <><MdWifi size={16} /> Connected</> 
                      : <><MdWifiOff size={16} /> Reconnecting...</>}
                  </div>
                </div>
              )}
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-hidden">
                {/* System message for connection status */}
                {!showConnectionMessage && (
                  <div className="flex justify-center mb-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                      isConnected 
                        ? "bg-green-900/20 text-green-400 border border-green-800" 
                        : "bg-red-900/20 text-red-400 border border-red-800"
                    }`}>
                      {isConnected 
                        ? <><MdWifi size={12} /> Connected</> 
                        : <><MdWifiOff size={12} /> Reconnecting...</>}
                    </div>
                  </div>
                )}
                
                {selectedCustomerData.chats && selectedCustomerData.chats.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl p-3 px-4 ${
                        message.sender === "admin" 
                          ? "bg-[#025cca] text-white" 
                          : "bg-[#323232] text-white"
                      }`}
                    >
                      <p>{message.text}</p>
                      <div className="flex items-center justify-end mt-1 text-xs">
                        <span className="text-[#ababab]">{formatTime(message.timestamp)}</span>
                        {message.sender === "admin" && (
                          <span className="ml-1">
                            {message.read ? (
                              <MdCheck size={14} className="text-[#ababab]" />
                            ) : (
                              <MdCheck size={14} className="text-[#777]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
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
                
                <div ref={messageEndRef} />
              </div>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-[#262626] rounded-b-lg">
                <div className="flex items-center">
                  <div className="flex-1 bg-[#323232] rounded-full px-4 py-2 relative">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleTyping}
                      className="w-full bg-transparent text-white focus:outline-none"
                    />
                    
                    {/* Small connection status indicator inside input field */}
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                  </div>
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending || !isConnected}
                    className={`ml-2 p-3 rounded-full ${
                      newMessage.trim() && !sendMessageMutation.isPending && isConnected 
                        ? "bg-[#F6B100] text-[#1a1a1a]" 
                        : "bg-[#3a3a3a] text-[#6a6a6a]"
                    }`}
                    title={!isConnected ? "Waiting for connection..." : ""}
                  >
                    <MdSend size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Add CSS for typing indicator and custom scrollbar */}
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

export default AdminSupport;