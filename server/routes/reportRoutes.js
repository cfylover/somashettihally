const express = require("express");
const router = express.Router();

const { getDashboardReport } = require("../controllers/reportController");
const { protect, isAdmin } = require("../middleware/auth");

// Reports are Admin-only
router.get("/dashboard", protect, isAdmin, getDashboardReport);

module.exports = router;
