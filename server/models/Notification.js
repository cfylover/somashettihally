const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Title of the notification / announcement
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Full message body
    message: {
      type: String,
      default: "",
      trim: true,
    },

    // Category of notification
    type: {
      type: String,
      enum: ["General", "Payment Reminder", "Event", "Emergency"],
      default: "General",
    },

    // The intended audience for this notification
    targetAudience: {
      type: String,
      enum: ["All Members", "Admins", "Sponsors"],
      default: "All Members",
    },

    // Scheduled / publish date
    date: {
      type: Date,
      default: Date.now,
    },

    // Scheduled time (12-hour / 24-hour string like "10:30 AM")
    time: {
      type: String,
      default: "",
      trim: true,
    },

    // Track whether the notification has been read/seen
    read: {
      type: Boolean,
      default: false,
    },

    // Which user created this notification
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
notificationSchema.index({ type: 1, date: -1 });
notificationSchema.index({ targetAudience: 1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);

