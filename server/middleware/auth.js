const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ganapathi_secret_key_2026";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("FATAL: JWT_SECRET must be set in production");
}

// Protect routes - verifies the JWT token and attaches the user to req.user
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Admin only - returns 403 Forbidden if the user role is not Admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: Admin access only" });
  }
  next();
};

module.exports = { protect, isAdmin };
