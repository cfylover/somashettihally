const Expense = require("../models/Expense");
const mongoose = require("mongoose");

// Get all expenses
const getExpenses = async (req, res) => {
  console.log("📤 getExpenses() called");

  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("❌ Error fetching expenses:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add an expense (Admin only)
const addExpense = async (req, res) => {
  console.log("📤 addExpense() called");
  console.log("📦 Received Data:", req.body);

  try {
    const { category, title, amount, paidTo, paymentMethod, date, description } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ message: "Expense title is required" });
    }

    const expenseAmount = Number(amount);
    if (isNaN(expenseAmount) || expenseAmount < 0) {
      return res.status(400).json({ message: "Amount must be a valid number" });
    }

    const expense = await Expense.create({
      category: category || "Others",
      title: title.trim(),
      amount: expenseAmount,
      paidTo: paidTo || "",
      paymentMethod: paymentMethod || "Cash",
      date: date ? new Date(date) : new Date(),
      description: description || "",
      createdBy: req.user ? req.user.id || req.user._id : null,
    });

    console.log(`✅ Expense saved: ${expense._id}`);
    res.status(201).json(expense);
  } catch (err) {
    console.error("❌ Error in addExpense():", err);
    res.status(400).json({ message: err.message });
  }
};

// Update an expense (Admin only)
const updateExpense = async (req, res) => {
  console.log("📤 updateExpense() called for:", req.params.id);

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const existing = await Expense.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const { category, title, amount, paidTo, paymentMethod, date, description } = req.body;

    existing.category = category || existing.category;
    existing.title = title !== undefined ? title.trim() : existing.title;
    existing.amount = amount !== undefined ? Number(amount) : existing.amount;
    existing.paidTo = paidTo !== undefined ? paidTo : existing.paidTo;
    existing.paymentMethod = paymentMethod || existing.paymentMethod;
    existing.date = date ? new Date(date) : existing.date;
    existing.description = description !== undefined ? description : existing.description;

    await existing.save();

    console.log(`✅ Expense updated: ${id}`);
    res.json(existing);
  } catch (err) {
    console.error("❌ Error in updateExpense():", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete an expense (Admin only)
const deleteExpense = async (req, res) => {
  console.log("📤 deleteExpense() called for:", req.params.id);

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    console.log(`✅ Expense deleted: ${id}`);
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteExpense():", err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
};
