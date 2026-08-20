const express = require("express");
const router = express.Router();

const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const { protect, isAdmin } = require("../middleware/auth");

// Get all expenses - any authenticated user
router.get("/", protect, getExpenses);

// Add expense - Admin only
router.post("/", protect, isAdmin, addExpense);

// Update expense - Admin only
router.put("/:id", protect, isAdmin, updateExpense);

// Delete expense - Admin only
router.delete("/:id", protect, isAdmin, deleteExpense);

module.exports = router;
