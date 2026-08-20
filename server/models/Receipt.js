const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    // Which collection this receipt came from
    sourceType: {
      type: String,
      enum: ["payment", "sponsor"],
      required: true,
    },

    // Reference to the source document
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Recifeed / sponsor details
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },

    recipientPhone: {
      type: String,
      default: "",
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      default: "Cash",
    },

    // Auto-generated receipt number e.g. AS-2026-00001
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Admin who received the money
    receivedBy: {
      type: String,
      default: "",
    },

    // User who generated/owns this receipt (admin)
    receivedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // The member-user this receipt belongs to (for "Member sees own receipt")
    ownerMemberUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Receipt", receiptSchema);

