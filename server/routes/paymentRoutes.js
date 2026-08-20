const express = require("express");
const router = express.Router();

const {
  getPayments,
  getPaymentById,
  addPayment,
  deletePayment,
} = require("../controllers/paymentController");

const { protect, isAdmin } = require("../middleware/auth");

// Get all payments - any authenticated user
router.get("/", protect, getPayments);

// Get a single payment - any authenticated user
router.get("/:id", protect, getPaymentById);

// Record a payment - Admin only
router.post("/", protect, isAdmin, addPayment);

// Delete a payment - Admin only
router.delete("/:id", protect, isAdmin, deletePayment);

module.exports = router;

