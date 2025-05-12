const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { 
  createOrder, 
  verifyPayment, 
  webHookVerification, 
  getDailyEarnings,
  getAllPayments, 
  createAdditionalItemsOrder,
  getTotalEarnings,
  getDayByDayPayments,
  getDailyEarningsByRange 
} = require("../controllers/paymentController");

// Existing Routes
router.route("/create-order").post(isVerifiedUser, createOrder);
router.route("/verify-payment").post(isVerifiedUser, verifyPayment);
router.route("/webhook-verification").post(webHookVerification);
router.route("/daily-earnings").get(getDailyEarnings);

// New Route for fetching all payments
router.route("/").get(isVerifiedUser, getAllPayments);
router.route("/create-additional-order").post(isVerifiedUser, createAdditionalItemsOrder);

// New route for total earnings
router.route("/total-earnings").get(isVerifiedUser, getTotalEarnings);

// Add this new route
router.route("/day-by-day").get(isVerifiedUser, getDayByDayPayments);

// New route for daily earnings by range
router.route("/daily-earnings-range").get(isVerifiedUser, getDailyEarningsByRange);

module.exports = router;