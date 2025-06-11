const express = require("express");
const router = express.Router();
const supportController = require("../controllers/supportController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");

// First, check that all controller functions exist
// console.log("Controller functions:", {
//   getCustomers: supportController.getCustomers,
//   sendMessage: supportController.sendMessage,
//   markAsRead: supportController.markAsRead,
//   updateStatus: supportController.updateStatus
// });

// Public routes (no authentication)
router.post("/register", supportController.registerCustomer);
router.post("/customer-message", supportController.sendCustomerMessage);
router.get("/lookup/:phone", supportController.lookupByPhone);    // New endpoint
router.get("/chats/:id", supportController.getCustomerChats);    // New endpoint

// Apply authentication to all routes
router.use(isVerifiedUser);

// Support routes
router.get("/customers", supportController.getCustomers);
router.post("/messages", supportController.sendMessage);
router.put("/customers/:id/read", supportController.markAsRead);
router.put("/customers/:id/status", supportController.updateStatus);

module.exports = router;