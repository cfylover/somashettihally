const express = require("express");
const router = express.Router();

const {
  getNotifications,
  addNotification,
  updateNotification,
  deleteNotification,
} = require("../controllers/notificationController");

const { protect, isAdmin } = require("../middleware/auth");

// Get all notifications - any authenticated user (View only for Members)
router.get("/", protect, getNotifications);

// Add notification - Admin only
router.post("/", protect, isAdmin, addNotification);

// Update notification - Admin only
router.put("/:id", protect, isAdmin, updateNotification);

// Delete notification - Admin only
router.delete("/:id", protect, isAdmin, deleteNotification);

module.exports = router;

