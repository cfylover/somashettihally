const express = require("express");
const router = express.Router();

const {
  getReceipts,
  getReceiptById,
  deleteReceipt,
} = require("../controllers/receiptController");

const { protect, isAdmin } = require("../middleware/auth");

// Get all receipts - any authenticated user (filtered by role)
router.get("/", protect, getReceipts);

// Get a single receipt - any authenticated user (owner/admin only)
router.get("/:id", protect, getReceiptById);

// Delete a receipt - Admin only
router.delete("/:id", protect, isAdmin, deleteReceipt);

module.exports = router;

