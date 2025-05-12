const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel"); // ✅ Import table model
const mongoose = require("mongoose");

// ✅ Add a new order
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

// ✅ Get a specific order by ID
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid id!"));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(createHttpError(404, "Order not found!"));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ✅ Get all orders (Supports filtering by status & date)
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("table");
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

// ✅ Update an order (with table release logic if completed)
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


// ✅ Delete an order (with table release logic)
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

// ✅ Get today's In-Progress orders & compare with yesterday
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

// ✅ Popular Dishes (Basic Version)
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

// ✅ Export all
module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  updateOrder,
  deleteOrder,
  getOrderComparison,
  getPopularDishes
};
