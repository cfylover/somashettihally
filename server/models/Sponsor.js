const mongoose = require("mongoose");

const sponsorSchema = new mongoose.Schema(
  {
    sponsorName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer"],
      default: "Cash",
    },

    receiptNumber: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Pending",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
sponsorSchema.index({ status: 1, date: -1 });
sponsorSchema.index({ sponsorName: 1 });

module.exports = mongoose.model("Sponsor", sponsorSchema);
