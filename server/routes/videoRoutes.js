const express = require("express");
const router = express.Router();

// Video routes removed — video uploads are not supported in this deployment.
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.status(410).json({ message: "Videos are disabled" }));

module.exports = router;
