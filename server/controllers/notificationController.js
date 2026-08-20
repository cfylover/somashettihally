const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// Get all notifications (authenticated users only)
const getNotifications = async (req, res) => {
  console.log("📤 getNotifications() called");

  try {
    const notifications = await Notification.find().sort({ date: -1, createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add a notification (Admin only)
const addNotification = async (req, res) => {
  console.log("📤 addNotification() called");
  console.log("📦 Received Data:", req.body);

  try {
    const { title, message, type, targetAudience, date, time } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ message: "Notification title is required" });
    }

    const notification = await Notification.create({
      title: title.trim(),
      message: message || "",
      type: type || "General",
      targetAudience: targetAudience || "All Members",
      date: date ? new Date(date) : new Date(),
      time: time || "",
      read: false,
      createdBy: req.user ? req.user.id || req.user._id : null,
    });

    console.log(`✅ Notification saved: ${notification._id}`);
    res.status(201).json(notification);
  } catch (err) {
    console.error("❌ Error in addNotification():", err);
    res.status(400).json({ message: err.message });
  }
};

// Update a notification (Admin only)
const updateNotification = async (req, res) => {
  console.log("📤 updateNotification() called for:", req.params.id);

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const existing = await Notification.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const { title, message, type, targetAudience, date, time, read } = req.body;

    existing.title = title !== undefined ? title.trim() : existing.title;
    existing.message = message !== undefined ? message : existing.message;
    existing.type = type || existing.type;
    existing.targetAudience = targetAudience || existing.targetAudience;
    existing.date = date ? new Date(date) : existing.date;
    existing.time = time !== undefined ? time : existing.time;
    existing.read = read !== undefined ? Boolean(read) : existing.read;

    await existing.save();

    console.log(`✅ Notification updated: ${id}`);
    res.json(existing);
  } catch (err) {
    console.error("❌ Error in updateNotification():", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete a notification (Admin only)
const deleteNotification = async (req, res) => {
  console.log("📤 deleteNotification() called for:", req.params.id);

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    console.log(`✅ Notification deleted: ${id}`);
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteNotification():", err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getNotifications,
  addNotification,
  updateNotification,
  deleteNotification,
};

