const express = require("express");
const {
  addOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderComparison,
  getPopularDishes
} = require("../controllers/orderController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");

const router = express.Router();

router.get("/popular-dishes", isVerifiedUser, getPopularDishes);
router.get("/comparison", isVerifiedUser, getOrderComparison);
router.post("/", isVerifiedUser, addOrder);
router.get("/", isVerifiedUser, getOrders);
router.get("/:id", isVerifiedUser, getOrderById);
router.put("/:id", isVerifiedUser, updateOrder); // ✅ THIS LINE
router.delete("/:id", isVerifiedUser, deleteOrder);

module.exports = router;
