// Paymentcontroller.js
const Razorpay = require("razorpay");
const config = require("../config/config");
const crypto = require("crypto");
const Payment = require("../models/paymentModel");
const createHttpError = require("http-errors");

const createOrder = async (req, res, next) => {
  const razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpaySecretKey,
  });

  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", config.razorpaySecretKey)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully!" });
    } else {
      const error = createHttpError(400, "Payment verification failed!");
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

const webHookVerification = async (req, res, next) => {
  try {
    const secret = config.razorpayWebhookSecret;
    
    if (!secret) {
      console.error("Razorpay webhook secret is not defined in configuration");
      return next(createHttpError(500, "Webhook secret configuration is missing"));
    }
    
    const signature = req.headers["x-razorpay-signature"];

    const body = JSON.stringify(req.body);

    // 🛑 Verify the signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === signature) {
      console.log("✅ Webhook verified:", req.body);

      // ✅ Process payment (e.g., update DB, send confirmation email)
      if (req.body.event === "payment.captured") {
        const payment = req.body.payload.payment.entity;
        console.log(`💰 Payment Captured: ${payment.amount / 100} INR`);

        // Add Payment Details in Database
        const newPayment = new Payment({
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
          createdAt: new Date(payment.created_at * 1000),
          isAdditionalPayment: payment.notes && payment.notes.isAdditionalPayment === "true"
        });

        await newPayment.save();
      }

      res.json({ success: true });
    } else {
      const error = createHttpError(400, "❌ Invalid Signature!");
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

// Function for creating order for additional items (new)
const createAdditionalItemsOrder = async (req, res, next) => {
  const razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpaySecretKey,
  });

  try {
    const { amount, orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Original order ID is required" 
      });
    }
    
    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_add_${Date.now()}`,
      notes: {
        isAdditionalPayment: "true",
        originalOrderId: orderId
      }
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Function to get daily earnings
const getDailyEarnings = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: "Date parameter is required" 
      });
    }
    
    // Create date ranges for today and yesterday
    const todayStart = new Date(date);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(date);
    todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    
    // Query payments for today
    const todayResult = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: "captured"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);
    
    // Query payments for yesterday
    const yesterdayResult = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
          status: "captured"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);
    
    // Ensure we always return a number
    const todayEarnings = todayResult.length > 0 ? Number(todayResult[0].totalAmount) : 0;
    const yesterdayEarnings = yesterdayResult.length > 0 ? Number(yesterdayResult[0].totalAmount) : 0;

    res.status(200).json({ 
      success: true, 
      todayEarnings, 
      yesterdayEarnings 
    });
  } catch (error) {
    console.error("Error fetching daily earnings:", error);
    next(error);
  }
};

// New function to get all payments
const getAllPayments = async (req, res, next) => {
  try {
    // Get query parameters for pagination (optional)
    const { page = 1, limit = 50 } = req.query;
    
    // Convert page and limit to integers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination info
    const total = await Payment.countDocuments();
    
    // Get payments with pagination and sort by most recent first
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.status(200).json({
      success: true,
      payments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    next(error);
  }
};

// Add this new function to your paymentController.js
const getTotalEarnings = async (req, res, next) => {
  try {
    // Calculate total earnings from all successful payments
    const result = await Payment.aggregate([
      { $match: { status: "captured" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    
    // Ensure we always return a number
    const totalEarnings = result.length > 0 ? Number(result[0].totalAmount) : 0;

    res.status(200).json({ 
      success: true, 
      totalEarnings
    });
  } catch (error) {
    console.error("Error fetching total earnings:", error);
    next(error);
  }
};

// Add this new function to get day-by-day payment information
const getDayByDayPayments = async (req, res, next) => {
  try {
    // Get start and end dates from query parameters
    let { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date parameters are required"
      });
    }

    // Parse dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date"
      });
    }
    
    // Get payments grouped by date
    const dailyPayments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: "captured"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          date: { $first: "$createdAt" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { date: 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          totalAmount: 1,
          count: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      dailyPayments
    });
  } catch (error) {
    console.error("Error fetching day-by-day payments:", error);
    next(error);
  }
};

// Add this function to your paymentController.js

// Function to get daily earnings by range (last7days, last30days, etc.)
const getDailyEarningsByRange = async (req, res, next) => {
  try {
    const { range } = req.query;
    
    // Default to last7days if no range specified
    const rangeType = range || "last7days";
    
    // Calculate date range based on selection
    let startDate = new Date();
    let endDate = new Date();
    
    switch (rangeType) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "last7days":
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last30days":
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last90days":
        startDate.setDate(startDate.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Format dates for aggregation
    const formattedDates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      formattedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get payments for the specified period
    const paymentsData = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "captured"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          date: { $first: "$createdAt" },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // Create formatted date labels and earnings values
    let dates = [];
    let earnings = [];
    
    // Fill in data or zeros for each day
    formattedDates.forEach(date => {
      // Use ISO date format instead of formatted string
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      dates.push(formattedDate);
      
      const dayData = paymentsData.find(item => 
        new Date(item.date).toDateString() === date.toDateString()
      );
      
      earnings.push(dayData ? Number(dayData.totalAmount) : 0);
    });
    
    // Calculate percentage change
    let percentageChange = 0;
    if (rangeType === "last7days" || rangeType === "last30days" || rangeType === "last90days") {
      const currentPeriodTotal = earnings.slice(earnings.length / 2).reduce((sum, val) => sum + val, 0);
      const previousPeriodTotal = earnings.slice(0, earnings.length / 2).reduce((sum, val) => sum + val, 0);
      
      if (previousPeriodTotal > 0) {
        percentageChange = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;
      } else if (currentPeriodTotal > 0) {
        percentageChange = 100;
      }
    }
    
    // Add this logging to debug
    console.log("Date range query:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    // For today's data, always do a fresh query to ensure we have the latest
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayData = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: "captured"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);
    
    // If today is part of the date range, use the fresh data
    if (formattedDates.some(date => date.toDateString() === new Date().toDateString())) {
      const todayIndex = formattedDates.findIndex(date => 
        date.toDateString() === new Date().toDateString()
      );
      
      if (todayIndex !== -1) {
        earnings[todayIndex] = todayData.length > 0 ? Number(todayData[0].totalAmount) : 0;
      }
    }
    
    res.status(200).json({
      success: true,
      dates,
      earnings,
      percentageChange
    });
  } catch (error) {
    console.error("Error fetching daily earnings by range:", error);
    next(error);
  }
};

// Don't forget to export the new function
module.exports = {
  createOrder,
  verifyPayment,
  webHookVerification,
  getDailyEarnings,
  getAllPayments,
  createAdditionalItemsOrder,
  getTotalEarnings,
  getDayByDayPayments,
  getDailyEarningsByRange
};