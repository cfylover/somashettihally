const express = require("express");
const router = express.Router();

// Gallery routes removed — image uploads are not supported in this deployment.
router.get("/", (req, res) => res.status(410).json({ message: "Gallery is disabled" }));
module.exports = router;
