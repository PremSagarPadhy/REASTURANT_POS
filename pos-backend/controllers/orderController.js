const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const mongoose = require("mongoose");

// Add a new order
const addOrder = async (req, res, next) => {
  try {
    const order = new Order(req.body);
    
    // Save the order first to get its ID
    await order.save();
    
    // If the order has a table, update the table status to "Booked"
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: "Booked",
        currentOrder: order._id
      });
      console.log(`Table ${order.table} marked as Booked for new order ${order._id}`);
    }
    
    // Emit socket event for new order notification
    const io = req.app.get('io');
    console.log('Socket IO available?', !!io); // Log if io is available

    if (io) {
      // Create a source string that includes table info if available
      const source = order.table ? `Table ${order.table}` : "Direct Order";
      
      // Add the try-catch block here around the socket emission
      try {
        console.log('📣 Emitting new:order event with data:', {
          orderId: order._id.toString(),
          source,
          customerName: order.customerDetails.name
        });
        
        io.emit('new:order', {
          orderId: order._id.toString(),
          source: source,
          customerName: order.customerDetails.name,
          timestamp: new Date()
        });
        
        console.log("✅ Socket event emitted successfully");
      } catch (socketError) {
        console.error("❌ Socket emission error:", socketError);
      }
    } else {
      console.error("❌ Socket.IO instance not available in request");
    }
    
    res.status(201).json({ 
      success: true, 
      message: "Order created!", 
      data: order 
    });
  } catch (error) {
    console.error("Error creating order:", error);
    next(error);
  }
};

// Get a specific order by ID
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await Order.findById(id).populate('table');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({ 
      success: true, 
      data: order 
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching order",
      error: error.message
    });
  }
};

// Get all orders (Supports filtering by status & date)
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("table");
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

// Update an order (with table release logic if completed)
const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerDetails, items, bills, paymentMethod, table, orderStatus } = req.body;

    console.log("Update Order Request:", {
      id,
      orderStatus,
      table
    });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid Order ID!"));
    }

    // Find the existing order before updating
    const existingOrder = await Order.findById(id).populate('table');
    if (!existingOrder) {
      return next(createHttpError(404, "Order not found!"));
    }

    console.log("Existing Order:", {
      id: existingOrder._id,
      table: existingOrder.table,
      currentStatus: existingOrder.orderStatus
    });

    // Only check for required fields if we're doing a full update
    if ((customerDetails !== undefined || items !== undefined || bills !== undefined) &&
        (!customerDetails || !items || !bills)) {
      return next(createHttpError(400, "Missing required fields for order update!"));
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        ...(customerDetails && { customerDetails }),
        ...(items && { items }),
        ...(bills && { bills }),
        ...(paymentMethod && { paymentMethod }),
        ...(table && { table }),
        ...(orderStatus && { orderStatus }),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('table');

    console.log("Updated order:", {
      id: updatedOrder._id,
      status: updatedOrder.orderStatus,
      tableId: updatedOrder.table ? updatedOrder.table._id : null
    });

    // Handle table status updates based on order status
    if (updatedOrder.table) {
      const tableId = updatedOrder.table._id || updatedOrder.table;
      
      console.log(`Processing table ${tableId} for order status ${orderStatus}`);
      
      if (orderStatus === "Completed") {
        console.log(`Attempting to mark table ${tableId} as Available`);
        const tableUpdateResult = await Table.findByIdAndUpdate(
          tableId,
          {
            status: "Available",
            currentOrder: null
          },
          { new: true }
        );
        console.log("Table update result:", tableUpdateResult);
      } 
      else if (["In Progress", "Ready"].includes(orderStatus)) {
        console.log(`Attempting to mark table ${tableId} as Booked`);
        const tableUpdateResult = await Table.findByIdAndUpdate(
          tableId,
          {
            status: "Booked",
            currentOrder: updatedOrder._id
          },
          { new: true }
        );
        console.log("Table update result:", tableUpdateResult);
      }
      else {
        console.log(`No table status change for order status: ${orderStatus}`);
      }
    } else {
      console.log("No table associated with this order");
    }

    // Emit socket event for order status update
    const io = req.app.get('io');
    if (io && orderStatus) {
      io.emit('order:update', {
        orderId: updatedOrder._id.toString(),
        status: orderStatus,
        customerName: updatedOrder.customerDetails?.name || "Unknown",
        timestamp: new Date()
      });
      console.log(`Emitted order:update event for order ${updatedOrder._id} with status ${orderStatus}`);
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order:", error.stack);
    next(error);
  }
};


// Delete an order (with table release logic)
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid Order ID!"));
    }

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return next(createHttpError(404, "Order not found!"));
    }

    // ✅ Free the table if it was booked
    if (existingOrder.table) {
      await Table.findOneAndUpdate(
        { _id: existingOrder.table },
        {
          status: "Available",
          currentOrder: null
        }
      );
    }

    await Order.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully and table released."
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    next(error);
  }
};

// Get today's In-Progress orders & compare with yesterday
const getOrderComparison = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const todayInProgress = await Order.countDocuments({
      orderStatus: "In Progress",
      orderDate: { $gte: today, $lte: endOfToday },
    });

    const yesterdayInProgress = await Order.countDocuments({
      orderStatus: "In Progress",
      orderDate: { $gte: startOfYesterday, $lte: endOfYesterday },
    });

    res.status(200).json({
      success: true,
      todayInProgress,
      yesterdayInProgress,
    });
  } catch (error) {
    next(error);
  }
};

// Popular Dishes (Basic Version)
const getPopularDishes = async (req, res, next) => {
  try {
    const popularDishesData = await Order.aggregate([
      { $match: { "items": { $exists: true, $ne: [] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          numberOfOrders: { $sum: 1 }
        }
      },
      { $sort: { numberOfOrders: -1 } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          numberOfOrders: 1
        }
      }
    ]);

    if (!popularDishesData || popularDishesData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No order data available yet",
        data: [
          { name: "Margherita Pizza", numberOfOrders: 28 },
          { name: "Chicken Burger", numberOfOrders: 24 },
          { name: "Pasta Carbonara", numberOfOrders: 22 },
          { name: "Vegetable Salad", numberOfOrders: 18 },
          { name: "Mushroom Soup", numberOfOrders: 15 }
        ]
      });
    }

    res.status(200).json({
      success: true,
      data: popularDishesData
    });
  } catch (error) {
    console.error("Error in getPopularDishes:", error);
    res.status(200).json({
      success: true,
      message: "Error processing order data, showing sample data",
      data: [
        { name: "Margherita Pizza", numberOfOrders: 28 },
        { name: "Chicken Burger", numberOfOrders: 24 },
        { name: "Pasta Carbonara", numberOfOrders: 22 },
        { name: "Vegetable Salad", numberOfOrders: 18 },
        { name: "Mushroom Soup", numberOfOrders: 15 }
      ]
    });
  }
};

// Assign waiter to order
const assignWaiterToOrder = async (req, res, next) => {
  try {
    const { orderId, waiterId } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        assignedWaiter: waiterId,
        'assignedAt.waiter': new Date()
      },
      { new: true }
    ).populate('assignedWaiter', 'empid name position')
     .populate('assignedCook', 'empid name position')
     .populate('table');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error assigning waiter:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign cook to order
const assignCookToOrder = async (req, res, next) => {
  try {
    const { orderId, cookId } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        assignedCook: cookId,
        'assignedAt.cook': new Date()
      },
      { new: true }
    ).populate('assignedWaiter', 'empid name position')
     .populate('assignedCook', 'empid name position')
     .populate('table');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error assigning cook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get working orders with employee assignments
const getWorkingOrders = async (req, res, next) => {
  try {
    const { status, employeeType } = req.query;
    
    let filter = {
      orderStatus: { $in: ['pending', 'preparing', 'ready', 'served', 'In Progress', 'Ready', 'Completed'] }
    };

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    let orders = await Order.find(filter)
      .populate('assignedWaiter', 'empid name position')
      .populate('assignedCook', 'empid name position')
      .populate('table')
      .sort({ createdAt: -1 });

    // Filter by employee type if specified
    if (employeeType === 'waiter') {
      orders = orders.filter(order => order.assignedWaiter);
    } else if (employeeType === 'cook') {
      orders = orders.filter(order => order.assignedCook);
    }

    // Group orders by employee
    const groupedData = {
      waiters: {},
      cooks: {},
      unassigned: {
        waiter: [],
        cook: []
      }
    };

    orders.forEach(order => {
      // Group by waiter
      if (order.assignedWaiter) {
        const waiterId = order.assignedWaiter._id.toString();
        if (!groupedData.waiters[waiterId]) {
          groupedData.waiters[waiterId] = {
            employee: order.assignedWaiter,
            orders: []
          };
        }
        groupedData.waiters[waiterId].orders.push(order);
      } else {
        groupedData.unassigned.waiter.push(order);
      }

      // Group by cook
      if (order.assignedCook) {
        const cookId = order.assignedCook._id.toString();
        if (!groupedData.cooks[cookId]) {
          groupedData.cooks[cookId] = {
            employee: order.assignedCook,
            orders: []
          };
        }
        groupedData.cooks[cookId].orders.push(order);
      } else {
        groupedData.unassigned.cook.push(order);
      }
    });

    res.json({ 
      success: true, 
      data: {
        all: orders,
        grouped: groupedData
      }
    });
  } catch (error) {
    console.error('Error fetching working orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get employee workload summary
const getEmployeeWorkload = async (req, res, next) => {
  try {
    const activeOrders = await Order.find({
      orderStatus: { $in: ['pending', 'preparing', 'ready'] }
    }).populate('assignedWaiter assignedCook', 'empid name position');

    const workloadSummary = {
      waiters: {},
      cooks: {}
    };

    activeOrders.forEach(order => {
      if (order.assignedWaiter) {
        const waiterId = order.assignedWaiter._id.toString();
        if (!workloadSummary.waiters[waiterId]) {
          workloadSummary.waiters[waiterId] = {
            employee: order.assignedWaiter,
            activeOrders: 0,
            orders: []
          };
        }
        workloadSummary.waiters[waiterId].activeOrders++;
        workloadSummary.waiters[waiterId].orders.push({
          orderId: order._id,
          status: order.orderStatus,
          table: order.table,
          customerName: order.customerDetails.name
        });
      }

      if (order.assignedCook) {
        const cookId = order.assignedCook._id.toString();
        if (!workloadSummary.cooks[cookId]) {
          workloadSummary.cooks[cookId] = {
            employee: order.assignedCook,
            activeOrders: 0,
            orders: []
          };
        }
        workloadSummary.cooks[cookId].activeOrders++;
        workloadSummary.cooks[cookId].orders.push({
          orderId: order._id,
          status: order.orderStatus,
          table: order.table,
          customerName: order.customerDetails.name
        });
      }
    });

    res.json({ success: true, data: workloadSummary });
  } catch (error) {
    console.error('Error fetching employee workload:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export all
module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  updateOrder,
  deleteOrder,
  getOrderComparison,
  getPopularDishes,
  assignWaiterToOrder,
  assignCookToOrder,
  getWorkingOrders,
  getEmployeeWorkload
};
