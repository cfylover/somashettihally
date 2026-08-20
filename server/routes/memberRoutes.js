const express = require("express");
const router = express.Router();

// Member endpoints disabled per request
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.status(410).json({ message: "Members are disabled" }));
router.post("/", (req, res) => res.status(410).json({ message: "Members are disabled" }));
router.put("/:id", (req, res) => res.status(410).json({ message: "Members are disabled" }));
router.delete("/:id", (req, res) => res.status(410).json({ message: "Members are disabled" }));

module.exports = router;
