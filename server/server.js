const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");
const paymentRoutes = require("./routes/paymentRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const sponsorRoutes = require("./routes/sponsorRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Body size limit (1MB max)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Global rate limit: 300 requests per 15 min per IP (handles 200+ users)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});
app.use(globalLimiter);

// Strict rate limit for auth: 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});
app.use("/api/auth", authLimiter);

app.get("/", (req, res) => {
  res.json({ message: "AGRAJA SANGAM API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/reports", reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

const start = async () => {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // If running in development and there are no users, seed fallback admin/member
    // Note: User model's pre('save') hook auto-hashes passwords, so we pass plaintext here
    try {
      const userCount = await User.countDocuments();
      if (process.env.NODE_ENV !== "production" && userCount === 0) {
        console.log("No users found — seeding default dev users (admin/member)");

        await User.create([
          { username: "admin", password: "admin123", role: "Admin" },
          { username: "member", password: "member123", role: "Member" },
        ]);

        console.log("✅ Default dev users created: admin/member");
      }
    } catch (seedErr) {
      console.error("❌ Error while seeding default users:", seedErr);
    }
  } else {
    console.warn("MONGO_URI is not set; using development login fallback only");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Server startup failed:", err.message);
  process.exit(1);
});
