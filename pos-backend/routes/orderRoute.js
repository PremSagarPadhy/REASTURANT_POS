const express = require("express");
const {
  addOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderComparison,
  getPopularDishes,
  assignWaiterToOrder,
  assignCookToOrder,
  getWorkingOrders,
  getEmployeeWorkload
} = require("../controllers/orderController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");

// Middleware to ensure Socket.IO is available in routes
const socketMiddleware = (req, res, next) => {
  req.io = req.app.get('io');
  next();
};

const router = express.Router();

router.get("/popular-dishes", isVerifiedUser, getPopularDishes);
router.get("/comparison", isVerifiedUser, getOrderComparison);
router.get("/working", isVerifiedUser, getWorkingOrders);
router.get("/workload", isVerifiedUser, getEmployeeWorkload);
router.post("/assign-waiter", isVerifiedUser, assignWaiterToOrder);
router.post("/assign-cook", isVerifiedUser, assignCookToOrder);
router.post("/", isVerifiedUser, socketMiddleware, addOrder);
router.get("/", isVerifiedUser, getOrders);
router.get("/:id", isVerifiedUser, getOrderById);
router.put("/:id", isVerifiedUser, socketMiddleware, updateOrder);
router.delete("/:id", isVerifiedUser, deleteOrder);

module.exports = router;
