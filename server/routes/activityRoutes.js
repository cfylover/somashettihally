const express = require("express");
const router = express.Router();

const {
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController");

const { protect, isAdmin } = require("../middleware/auth");

// Get all activities - any authenticated user
router.get("/", protect, getActivities);

// Add activity - Admin only
router.post("/", protect, isAdmin, addActivity);

// Update activity - Admin only
router.put("/:id", protect, isAdmin, updateActivity);

// Delete activity - Admin only
router.delete("/:id", protect, isAdmin, deleteActivity);

module.exports = router;
