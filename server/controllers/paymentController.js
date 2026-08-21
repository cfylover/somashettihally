const Payment = require("../models/Payment");
const mongoose = require("mongoose");
const { createReceipt } = require("./receiptController");

// Generate a simple incremental receipt number (AGS-YYYY-000001)
const generateReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Payment.countDocuments();
  return `AGS-${year}-${String(count + 1).padStart(6, "0")}`;
};

// Get all payments (with optional pagination)
const getPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(),
    ]);

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get a single payment by id
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error("Error fetching payment:", err);
    res.status(500).json({ message: err.message });
  }
};

// Record a new payment (Admin only)
const addPayment = async (req, res) => {

  try {
    const { payerName, phone, amount, paymentMethod, transactionId, note, paymentDate, status } = req.body;

    if (!payerName || !amount) {
      return res.status(400).json({ message: "payerName and amount are required" });
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const method = paymentMethod || "Cash";
    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    // generate receipt number (non-critical — fallback to timestamp on failure)
    let receiptNumber = null;
    try {
      for (let i = 0; i < 3; i++) {
        const candidate = await generateReceiptNumber();
        const exists = await Payment.exists({ receiptNumber: candidate });
        if (!exists) {
          receiptNumber = candidate;
          break;
        }
      }
    } catch (genErr) {
      console.warn("Receipt number generation failed:", genErr.message);
    }
    if (!receiptNumber) receiptNumber = `AGS-${Date.now()}`;

    const created = await Payment.create({
      receiptNumber,
      payerName: payerName.trim(),
      phone: phone ? phone.trim() : "",
      amount: paymentAmount,
      paymentMethod: method,
      transactionId: transactionId || "",
      note: note || "",
      paymentDate: pDate,
      status: status || "Pending",
    });

    // create a system receipt (non-critical)
    try {
      await createReceipt({
        sourceType: "payment",
        sourceId: created._id,
        recipientName: created.payerName,
        recipientPhone: created.phone,
        amount: created.amount,
        paymentMethod: created.paymentMethod,
        receivedBy: req.user?.username || "",
        receivedByUserId: req.user?.id || null,
        date: created.paymentDate,
      });
    } catch (e) {
      console.warn("Receipt creation failed:", e.message);
    }

    res.status(201).json({ message: "Payment recorded", payment: created });
  } catch (err) {
    console.error("Error in addPayment:", err);

    // Distinguish client errors (validation) from server errors (DB, etc.)
    const isValidationError =
      err.message === "payerName and amount are required" ||
      err.message === "Invalid amount";

    if (isValidationError) {
      return res.status(400).json({ message: err.message });
    }

    // Mongoose validation errors (e.g. invalid enum value)
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate receipt number — please try again" });
    }

    res.status(500).json({ message: err.message || "Failed to record payment" });
  }
};

// Delete a payment (admin only)
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    const p = await Payment.findByIdAndDelete(id);
    if (!p) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    console.error("Error deleting payment:", err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getPayments, getPaymentById, addPayment, deletePayment };
