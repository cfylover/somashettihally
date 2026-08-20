const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("FATAL: JWT_SECRET must be set in production");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || "ganapathi_secret_key_2026";
const allowDevFallback = process.env.NODE_ENV !== "production" && !process.env.MONGO_URI;
const fallbackUsers = [
  { id: "dev-admin", username: "admin", password: "admin123", role: "Admin" },
  { id: "dev-member", username: "member", password: "member123", role: "Member" },
];

const loginWithDevFallback = (username, password, res) => {
  const user = fallbackUsers.find(
    (u) => u.username === username.trim() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
    },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  console.log("📤 login() called");
  console.log("📦 Received Data:", req.body);

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    if (allowDevFallback) {
      return loginWithDevFallback(username, password, res);
    }

    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log(`✅ Login successful: ${user.username} (${user.role})`);

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { login };
