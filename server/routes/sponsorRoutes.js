const express = require("express");
const router = express.Router();

const {
  getSponsors,
  addSponsor,
  updateSponsor,
  deleteSponsor,
} = require("../controllers/sponsorController");

const { protect, isAdmin } = require("../middleware/auth");

// Get all sponsors - any authenticated user
router.get("/", protect, getSponsors);

// Write operations - Admin only (403 for Members)
router.post("/", protect, isAdmin, addSponsor);
router.put("/:id", protect, isAdmin, updateSponsor);
router.delete("/:id", protect, isAdmin, deleteSponsor);

module.exports = router;
