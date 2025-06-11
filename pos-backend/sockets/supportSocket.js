const SupportCustomer = require("../models/supportModel");
const mongoose = require("mongoose");

module.exports = (io) => {
  // Store active connections
  const activeUsers = new Map(); // Maps customerId/adminId to socketId
  const adminSockets = new Set(); // Set of admin socket IDs

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Customer authentication
    socket.on('customer:auth', (customerId) => {
      console.log(`Customer ${customerId} authenticated`);
      
      // Store customer connection
      activeUsers.set(customerId, socket.id);
      socket.customerId = customerId;
      
      // Join customer-specific room
      socket.join(`customer:${customerId}`);
      
      // Notify admins that customer is online
      io.to('admins').emit('customer:online', customerId);
    });
    
    // Admin authentication
    socket.on('admin:auth', (adminId) => {
      console.log(`Admin ${adminId} authenticated`);
      
      // Store admin connection
      activeUsers.set(`admin:${adminId}`, socket.id);
      adminSockets.add(socket.id);
      socket.adminId = adminId;
      
      // Join admin room
      socket.join('admins');
    });
    
    // Customer typing indicator
    socket.on('customer:typing', async (customerId) => {
      io.to('admins').emit('customer:typing', customerId);
    });
    
    // Admin typing indicator
    socket.on('admin:typing', async (customerId) => {
      io.to(`customer:${customerId}`).emit('admin:typing');
    });
    
    // Customer sends a message
    socket.on('customer:message', async (data) => {
      try {
        const { customerId, message } = data;
        
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
          return socket.emit('error', { message: 'Invalid customer ID' });
        }
        
        // Save message to database
        const customer = await SupportCustomer.findById(customerId);
        if (!customer) {
          return socket.emit('error', { message: 'Customer not found' });
        }
        
        // Create new message object
        const newMessage = {
          id: new mongoose.Types.ObjectId(),
          text: message,
          sender: 'customer',
          timestamp: new Date(),
          read: false
        };
        
        // Add message to customer's chats and update metrics
        customer.chats.push(newMessage);
        customer.lastActive = new Date();
        customer.unreadCount += 1;
        customer.status = 'active'; // Ensure conversation is marked as active
        
        await customer.save();
        
        // Broadcast message to all admins
        io.to('admins').emit('customer:message', {
          customerId,
          message: {
            id: newMessage.id.toString(),
            text: newMessage.text,
            timestamp: newMessage.timestamp,
            read: newMessage.read
          }
        });
        
        // Confirm message received to sender
        socket.emit('message:sent', { messageId: newMessage.id.toString() });
      } catch (error) {
        console.error('Error handling customer message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Admin sends a message
    socket.on('admin:message', async (data) => {
      try {
        const { customerId, message, adminId } = data;
        
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
          return socket.emit('error', { message: 'Invalid customer ID' });
        }
        
        // Save message to database
        const customer = await SupportCustomer.findById(customerId);
        if (!customer) {
          return socket.emit('error', { message: 'Customer not found' });
        }
        
        // Create new message object
        const newMessage = {
          id: new mongoose.Types.ObjectId(),
          text: message,
          sender: 'admin',
          adminId: adminId, // Optional: track which admin sent the message
          timestamp: new Date(),
          read: false
        };
        
        // Add message to customer's chats
        customer.chats.push(newMessage);
        customer.lastActive = new Date();
        
        await customer.save();
        
        // Send message to customer if online
        io.to(`customer:${customerId}`).emit('admin:message', {
          message: {
            id: newMessage.id.toString(),
            text: newMessage.text,
            timestamp: newMessage.timestamp
          }
        });
        
        // Confirm message sent to admin
        socket.emit('message:sent', { messageId: newMessage.id.toString() });
        
        // Broadcast to other admins
        socket.to('admins').emit('admin:message', {
          customerId,
          message: {
            id: newMessage.id.toString(),
            text: newMessage.text,
            timestamp: newMessage.timestamp,
            adminId: adminId
          }
        });
      } catch (error) {
        console.error('Error handling admin message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Mark messages as read by customer
    socket.on('customer:read', async (data) => {
      const { customerId, messageIds } = data;
      
      // Broadcast that customer has read messages to admins
      io.to('admins').emit('customer:read', { customerId, messageIds });
    });
    
    // Mark messages as read by admin
    socket.on('admin:read', async (customerId) => {
      try {
        // Update database to mark all messages as read
        const customer = await SupportCustomer.findById(customerId);
        if (customer) {
          customer.chats = customer.chats.map(msg => ({
            ...msg.toObject(),
            read: true
          }));
          
          customer.unreadCount = 0;
          await customer.save();
          
          // Notify customer that messages were read
          io.to(`customer:${customerId}`).emit('admin:read');
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Status update events
    socket.on('support:status', async (data) => {
      const { customerId, status } = data;
      
      try {
        await SupportCustomer.findByIdAndUpdate(customerId, { status });
        
        // Notify customer and all admins
        io.to(`customer:${customerId}`).emit('support:status', { status });
        io.to('admins').emit('support:status', { customerId, status });
      } catch (error) {
        console.error('Error updating support status:', error);
      }
    });
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.customerId) {
        // Customer disconnected
        activeUsers.delete(socket.customerId);
        io.to('admins').emit('customer:offline', socket.customerId);
      }
      
      if (socket.adminId) {
        // Admin disconnected
        adminSockets.delete(socket.id);
        activeUsers.delete(`admin:${socket.adminId}`);
      }
    });
  });
}