const createHttpError = require("http-errors");
const SupportCustomer = require("../models/supportModel");
const mongoose = require("mongoose");

// Get all support customers
const getCustomers = async (req, res, next) => {
  try {
    const customers = await SupportCustomer.find().sort({ lastActive: -1 });
    
    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error("Error fetching support customers:", error);
    next(error);
  }
};

// Send a message from admin to customer
const sendMessage = async (req, res, next) => {
  try {
    const { customerId, message } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return next(createHttpError(400, "Invalid customer ID"));
    }
    
    if (!message || typeof message !== 'string') {
      return next(createHttpError(400, "Message is required"));
    }
    
    const customer = await SupportCustomer.findById(customerId);
    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }
    
    // Create new message object
    const newMessage = {
      id: new mongoose.Types.ObjectId(),
      text: message,
      sender: "admin",
      timestamp: new Date(),
      read: false
    };
    
    // Add message to customer's chats
    customer.chats.push(newMessage);
    customer.lastActive = new Date();
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("Error sending message:", error);
    next(error);
  }
};

// Mark all messages as read
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid customer ID"));
    }
    
    const customer = await SupportCustomer.findById(id);
    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }
    
    // Mark all messages as read
    customer.chats = customer.chats.map(msg => ({
      ...msg.toObject(),
      read: true
    }));
    
    // Reset unread count
    customer.unreadCount = 0;
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    next(error);
  }
};

// Update customer status (active/resolved)
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid customer ID"));
    }
    
    if (!status || !["active", "resolved"].includes(status)) {
      return next(createHttpError(400, "Invalid status value"));
    }
    
    const customer = await SupportCustomer.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }
    
    res.status(200).json({
      success: true,
      message: `Customer status updated to ${status}`,
      data: customer
    });
  } catch (error) {
    console.error("Error updating customer status:", error);
    next(error);
  }
};

// Register a new customer or get existing one
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, lastOrder } = req.body;
    
    if (!name || !email || !phone) {
      return next(createHttpError(400, "Name, email and phone are required"));
    }
    
    // Check if customer already exists
    let customer = await SupportCustomer.findOne({ email });
    
    if (!customer) {
      // Create new customer
      customer = await SupportCustomer.create({
        name,
        email,
        phone,
        lastOrder: lastOrder || "None"
      });
    } else {
      // Update existing customer information
      customer.lastActive = new Date();
      await customer.save();
    }
    
    res.status(200).json({
      success: true,
      message: "Support session started",
      customerId: customer._id
    });
  } catch (error) {
    console.error("Error registering support customer:", error);
    next(error);
  }
};

// Send message from customer
const sendCustomerMessage = async (req, res, next) => {
  try {
    const { customerId, message } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return next(createHttpError(400, "Invalid customer ID"));
    }
    
    if (!message || typeof message !== 'string') {
      return next(createHttpError(400, "Message is required"));
    }
    
    const customer = await SupportCustomer.findById(customerId);
    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }
    
    // Create new message object
    const newMessage = {
      id: new mongoose.Types.ObjectId(),
      text: message,
      sender: "customer",
      timestamp: new Date(),
      read: false
    };
    
    // Add message to customer's chats and update metrics
    customer.chats.push(newMessage);
    customer.lastActive = new Date();
    customer.unreadCount += 1;
    customer.status = "active"; // Ensure the conversation is marked as active
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("Error sending customer message:", error);
    next(error);
  }
};

// Look up customer by phone number
const lookupByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.length < 10) {
      return next(createHttpError(400, "Valid phone number is required"));
    }
    
    const customer = await SupportCustomer.findOne({ phone });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer found with that phone number"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Customer found",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        lastOrder: customer.lastOrder,
        lastActive: customer.lastActive
      }
    });
  } catch (error) {
    console.error("Error looking up customer by phone:", error);
    next(error);
  }
};

// Get chat history for a customer
const getCustomerChats = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid customer ID"));
    }
    
    const customer = await SupportCustomer.findById(id);
    
    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }
    
    res.status(200).json({
      success: true,
      chats: customer.chats
    });
  } catch (error) {
    console.error("Error getting customer chats:", error);
    next(error);
  }
};

// Export the new functions
module.exports = {
  getCustomers,
  sendMessage,
  markAsRead,
  updateStatus,
  registerCustomer,
  sendCustomerMessage,
  lookupByPhone,       // New function
  getCustomerChats     // New function
};