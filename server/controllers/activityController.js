const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// Get all activities
const getActivities = async (req, res) => {
  console.log("📤 getActivities() called");

  try {
    const activities = await Activity.find().sort({ date: 1 });
    res.json(activities);
  } catch (err) {
    console.error("❌ Error fetching activities:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add an activity (Admin only)
const addActivity = async (req, res) => {
  console.log("📤 addActivity() called");
  console.log("📦 Received Data:", req.body);

  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      organizer,
      status,
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ message: "Activity title is required" });
    }

    if (!date) {
      return res.status(400).json({ message: "Activity date is required" });
    }

    const activity = await Activity.create({
      title: title.trim(),
      description: description || "",
      date: new Date(date),
      startTime: startTime || "",
      endTime: endTime || "",
      location: location || "",
      organizer: organizer || "",
      status: status || "Upcoming",
      createdBy: req.user ? req.user.id || req.user._id : null,
    });

    console.log(`✅ Activity saved: ${activity._id}`);
    res.status(201).json(activity);
  } catch (err) {
    console.error("❌ Error in addActivity():", err);
    res.status(400).json({ message: err.message });
  }
};

// Update an activity (Admin only)
const updateActivity = async (req, res) => {
  console.log("📤 updateActivity() called for:", req.params.id);

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid activity id" });
    }

    const existing = await Activity.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      organizer,
      status,
    } = req.body;

    existing.title = title !== undefined ? title.trim() : existing.title;
    existing.description = description !== undefined ? description : existing.description;
    existing.date = date ? new Date(date) : existing.date;
    existing.startTime = startTime !== undefined ? startTime : existing.startTime;
    existing.endTime = endTime !== undefined ? endTime : existing.endTime;
    existing.location = location !== undefined ? location : existing.location;
    existing.organizer = organizer !== undefined ? organizer : existing.organizer;
    existing.status = status || existing.status;

    await existing.save();

    console.log(`✅ Activity updated: ${id}`);
    res.json(existing);
  } catch (err) {
    console.error("❌ Error in updateActivity():", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete an activity (Admin only)
const deleteActivity = async (req, res) => {
  console.log("📤 deleteActivity() called for:", req.params.id);

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid activity id" });
    }

    const activity = await Activity.findByIdAndDelete(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    console.log(`✅ Activity deleted: ${id}`);
    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteActivity():", err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
};
