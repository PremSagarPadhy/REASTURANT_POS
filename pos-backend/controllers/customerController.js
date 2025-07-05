const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const mongoose = require("mongoose");

// Get all customers derived from orders
const getCustomers = async (req, res, next) => {
  try {
    const { timePeriod } = req.query;
    
    // Set date filter based on time period
    let dateFilter = {};
    if (timePeriod) {
      const now = new Date();
      let startDate;
      
      switch (timePeriod) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      dateFilter = { orderDate: { $gte: startDate } };
    }

    // Aggregate customer data from orders
    const customerAggregation = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$customerDetails.phone", // Group by phone as unique identifier
          name: { $first: "$customerDetails.name" },
          phone: { $first: "$customerDetails.phone" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$bills.totalWithTax" },
          lastVisit: { $max: "$orderDate" },
          orders: { $push: "$$ROOT" },
          avgGuests: { $avg: "$customerDetails.guests" }
        }
      },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: 1,
          phone: 1,
          email: { $concat: [{ $toLower: { $replaceAll: { input: "$name", find: " ", replacement: "." } } }, "@customer.com"] },
          totalOrders: 1,
          totalSpent: 1,
          avgOrderValue: { $divide: ["$totalSpent", "$totalOrders"] },
          lastVisit: 1,
          avgGuests: { $round: ["$avgGuests", 0] },
          customerType: {
            $switch: {
              branches: [
                { case: { $gte: ["$totalOrders", 10] }, then: "VIP" },
                { case: { $gte: ["$totalOrders", 3] }, then: "Regular" }
              ],
              default: "New"
            }
          },
          orders: 1
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    // Calculate customer statistics
    const stats = {
      total: customerAggregation.length,
      active: 0,
      recurring: 0,
      avgOrders: 0,
      avgSpend: 0
    };

    if (customerAggregation.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      stats.active = customerAggregation.filter(c => new Date(c.lastVisit) > thirtyDaysAgo).length;
      stats.recurring = customerAggregation.filter(c => c.totalOrders >= 2).length;
      stats.avgOrders = Math.round(customerAggregation.reduce((sum, c) => sum + c.totalOrders, 0) / stats.total);
      stats.avgSpend = Math.round(customerAggregation.reduce((sum, c) => sum + c.totalSpent, 0) / stats.total);
    }

    res.status(200).json({
      success: true,
      data: customerAggregation,
      stats: stats
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    next(error);
  }
};

// Get customer by phone number
const getCustomerByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const customerData = await Order.aggregate([
      { $match: { "customerDetails.phone": phone } },
      {
        $group: {
          _id: "$customerDetails.phone",
          name: { $first: "$customerDetails.name" },
          phone: { $first: "$customerDetails.phone" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$bills.totalWithTax" },
          lastVisit: { $max: "$orderDate" },
          firstVisit: { $min: "$orderDate" },
          orders: { $push: "$$ROOT" },
          avgGuests: { $avg: "$customerDetails.guests" }
        }
      },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: 1,
          phone: 1,
          email: { $concat: [{ $toLower: { $replaceAll: { input: "$name", find: " ", replacement: "." } } }, "@customer.com"] },
          totalOrders: 1,
          totalSpent: 1,
          avgOrderValue: { $divide: ["$totalSpent", "$totalOrders"] },
          lastVisit: 1,
          firstVisit: 1,
          avgGuests: { $round: ["$avgGuests", 0] },
          customerType: {
            $switch: {
              branches: [
                { case: { $gte: ["$totalOrders", 10] }, then: "VIP" },
                { case: { $gte: ["$totalOrders", 3] }, then: "Regular" }
              ],
              default: "New"
            }
          },
          orders: 1
        }
      }
    ]);

    if (!customerData || customerData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      data: customerData[0]
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    next(error);
  }
};

// Get customer statistics
const getCustomerStats = async (req, res, next) => {
  try {
    const { timePeriod = 'month' } = req.query;
    
    // Set date filter based on time period
    let dateFilter = {};
    const now = new Date();
    let startDate;
    
    switch (timePeriod) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    dateFilter = { orderDate: { $gte: startDate } };

    const stats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$customerDetails.phone",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$bills.totalWithTax" },
          lastVisit: { $max: "$orderDate" }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalOrders: { $sum: "$totalOrders" },
          totalRevenue: { $sum: "$totalSpent" },
          avgOrdersPerCustomer: { $avg: "$totalOrders" },
          avgSpendPerCustomer: { $avg: "$totalSpent" },
          recurringCustomers: {
            $sum: {
              $cond: [{ $gte: ["$totalOrders", 2] }, 1, 0]
            }
          },
          vipCustomers: {
            $sum: {
              $cond: [{ $gte: ["$totalOrders", 10] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalCustomers: 1,
          totalOrders: 1,
          totalRevenue: 1,
          avgOrdersPerCustomer: { $round: ["$avgOrdersPerCustomer", 2] },
          avgSpendPerCustomer: { $round: ["$avgSpendPerCustomer", 2] },
          recurringCustomers: 1,
          vipCustomers: 1,
          recurringPercentage: { 
            $round: [
              { $multiply: [{ $divide: ["$recurringCustomers", "$totalCustomers"] }, 100] }, 
              1
            ] 
          },
          vipPercentage: { 
            $round: [
              { $multiply: [{ $divide: ["$vipCustomers", "$totalCustomers"] }, 100] }, 
              1
            ] 
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalCustomers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      avgOrdersPerCustomer: 0,
      avgSpendPerCustomer: 0,
      recurringCustomers: 0,
      vipCustomers: 0,
      recurringPercentage: 0,
      vipPercentage: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    next(error);
  }
};

// Get top customers by spending
const getTopCustomers = async (req, res, next) => {
  try {
    const { limit = 10, timePeriod = 'month' } = req.query;
    
    // Set date filter based on time period
    let dateFilter = {};
    if (timePeriod) {
      const now = new Date();
      let startDate;
      
      switch (timePeriod) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      dateFilter = { orderDate: { $gte: startDate } };
    }

    const topCustomers = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$customerDetails.phone",
          name: { $first: "$customerDetails.name" },
          phone: { $first: "$customerDetails.phone" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$bills.totalWithTax" },
          lastVisit: { $max: "$orderDate" },
          avgGuests: { $avg: "$customerDetails.guests" }
        }
      },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: 1,
          phone: 1,
          totalOrders: 1,
          totalSpent: 1,
          avgOrderValue: { $divide: ["$totalSpent", "$totalOrders"] },
          lastVisit: 1,
          avgGuests: { $round: ["$avgGuests", 0] },
          customerType: {
            $switch: {
              branches: [
                { case: { $gte: ["$totalOrders", 10] }, then: "VIP" },
                { case: { $gte: ["$totalOrders", 3] }, then: "Regular" }
              ],
              default: "New"
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    console.error("Error fetching top customers:", error);
    next(error);
  }
};

// Update customer notes/info (this would update order records)
const updateCustomerInfo = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const { name, newPhone, email, notes } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Update customer details in all orders
    const updateData = {};
    if (name) updateData['customerDetails.name'] = name;
    if (newPhone) updateData['customerDetails.phone'] = newPhone;
    
    const updateResult = await Order.updateMany(
      { "customerDetails.phone": phone },
      { $set: updateData }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer information updated successfully",
      data: {
        updatedOrders: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    next(error);
  }
};

// Export all functions
module.exports = {
  getCustomers,
  getCustomerByPhone,
  getCustomerStats,
  getTopCustomers,
  updateCustomerInfo
};
