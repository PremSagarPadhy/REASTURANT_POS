const express = require("express");
const {
  getCustomers,
  getCustomerByPhone,
  getCustomerStats,
  getTopCustomers,
  updateCustomerInfo
} = require("../controllers/customerController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");

const router = express.Router();

// Get all customers with optional time period filter
router.get("/", isVerifiedUser, getCustomers);

// Get customer statistics
router.get("/stats", isVerifiedUser, getCustomerStats);

// Get top customers by spending
router.get("/top", isVerifiedUser, getTopCustomers);

// Get specific customer by phone
router.get("/:phone", isVerifiedUser, getCustomerByPhone);

// Update customer information
router.put("/:phone", isVerifiedUser, updateCustomerInfo);

module.exports = router;
