const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");
const Payment = require("./models/Payment");
const Expense = require("./models/Expense");
const Sponsor = require("./models/Sponsor");
const Activity = require("./models/Activity");
const Notification = require("./models/Notification");
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
  "https://somashettihally.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".onrender.com")) {
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

// POST /api/seed — Admin-only, clears old data and seeds fresh records
const { protect, isAdmin } = require("./middleware/auth");
app.post("/api/seed", protect, isAdmin, async (req, res) => {
  try {
    // Clear old data
    await Promise.all([
      Payment.deleteMany({}),
      Expense.deleteMany({}),
      Sponsor.deleteMany({}),
      Activity.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    const methods = ["Cash", "UPI", "Bank Transfer"];
    const randomDate = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
      return d;
    };

    const people = [
      { name: "Ravi Kumar", phone: "9876543210" },
      { name: "Suresh Patil", phone: "9845123456" },
      { name: "Mahesh Gowda", phone: "9900112233" },
      { name: "Prakash Sharma", phone: "9765432100" },
      { name: "Anil Reddy", phone: "9654321087" },
      { name: "Venkatesh Nayak", phone: "9543210876" },
      { name: "Rajesh Bhat", phone: "9432109876" },
      { name: "Ganesh Kulkarni", phone: "9321098765" },
      { name: "Shivu Halli", phone: "9210987654" },
      { name: "Naveen Das", phone: "9109876543" },
      { name: "Santosh Jadhav", phone: "9098765432" },
      { name: "Deepak Joshi", phone: "8987654321" },
      { name: "Vinayak Hegde", phone: "8876543210" },
      { name: "Yogesh Shirke", phone: "8765432109" },
      { name: "Manjunath K", phone: "8654321098" },
    ];
    const amounts = [2500, 1500, 3000, 500, 2000, 2500, 1000, 4000, 2500, 750, 2500, 3500, 2000, 1500, 2500];

    await Payment.insertMany(people.map((p, i) => ({
      receiptNumber: `AGS-2026-${String(i + 1).padStart(6, "0")}`,
      payerName: p.name, phone: p.phone, amount: amounts[i],
      paymentMethod: methods[i % 3], transactionId: i % 3 === 1 ? `TXN${100000 + i}` : "",
      paymentDate: randomDate(60), status: i < 10 ? "Paid" : "Pending",
    })));

    await Expense.insertMany([
      { category: "Decoration", title: "Mandap Decoration", amount: 8500, paidTo: "Raju Decorators", paymentMethod: "Cash", date: randomDate(30) },
      { category: "Sound", title: "DJ & Sound System", amount: 12000, paidTo: "Sonic Events", paymentMethod: "Bank", date: randomDate(25) },
      { category: "Food", title: "Prasad Preparation", amount: 15000, paidTo: "Annapurna Caterers", paymentMethod: "Cash", date: randomDate(20) },
      { category: "Lighting", title: "LED Light Setup", amount: 6500, paidTo: "Bright Solutions", paymentMethod: "UPI", date: randomDate(18) },
      { category: "Flowers", title: "Fresh Flower Garlands", amount: 4000, paidTo: "Phool Bazaar", paymentMethod: "Cash", date: randomDate(15) },
      { category: "Security", title: "Security Guards", amount: 5000, paidTo: "SafeGuard Services", paymentMethod: "Bank", date: randomDate(12) },
      { category: "Transportation", title: "Idol Transport", amount: 3500, paidTo: "Ganesh Transport", paymentMethod: "Cash", date: randomDate(10) },
      { category: "Decoration", title: "Arch Gate Setup", amount: 7000, paidTo: "Royal Events", paymentMethod: "UPI", date: randomDate(8) },
      { category: "Food", title: "Water & Beverages", amount: 2500, paidTo: "Reliance Mart", paymentMethod: "Cash", date: randomDate(5) },
      { category: "Others", title: "Print Banners", amount: 3000, paidTo: "Print Hub", paymentMethod: "Cash", date: randomDate(3) },
    ]);

    await Sponsor.insertMany([
      { sponsorName: "Kiran Enterprises", phone: "9876500001", amount: 25000, paymentMethod: "Bank Transfer", status: "Paid", date: randomDate(45) },
      { sponsorName: "Patel Hardware", phone: "9876500002", amount: 15000, paymentMethod: "Cash", status: "Paid", date: randomDate(40) },
      { sponsorName: "Sharma Jewellers", phone: "9876500003", amount: 50000, paymentMethod: "Bank Transfer", status: "Paid", date: randomDate(35) },
      { sponsorName: "Gowda Traders", phone: "9876500004", amount: 10000, paymentMethod: "UPI", status: "Paid", date: randomDate(30) },
      { sponsorName: "Reddy Motors", phone: "9876500005", amount: 20000, paymentMethod: "Cash", status: "Paid", date: randomDate(25) },
      { sponsorName: "Bhat Financial", phone: "9876500006", amount: 30000, paymentMethod: "Bank Transfer", status: "Pending", date: randomDate(20) },
      { sponsorName: "Nayak Constructions", phone: "9876500007", amount: 18000, paymentMethod: "UPI", status: "Paid", date: randomDate(15) },
      { sponsorName: "Joshi Electronics", phone: "9876500008", amount: 12000, paymentMethod: "Cash", status: "Pending", date: randomDate(10) },
    ]);

    await Activity.insertMany([
      { title: "Ganesh Chaturthi Puja", description: "Main puja ceremony", date: new Date("2026-08-27"), startTime: "6:00 AM", endTime: "9:00 AM", location: "Main Mandap", status: "Upcoming" },
      { title: "Cultural Program - Day 1", description: "Classical music and dance", date: new Date("2026-08-28"), startTime: "5:00 PM", endTime: "9:00 PM", location: "Open Ground", status: "Upcoming" },
      { title: "Ladies Sangeet Night", description: "Musical night", date: new Date("2026-08-29"), startTime: "7:00 PM", endTime: "11:00 PM", location: "Banquet Hall", status: "Upcoming" },
      { title: "Kids Fancy Dress", description: "Children's competition", date: new Date("2026-08-30"), startTime: "4:00 PM", endTime: "6:00 PM", location: "Main Stage", status: "Upcoming" },
      { title: "Grand Procession", description: "Ganesh Visarjan", date: new Date("2026-09-06"), startTime: "8:00 AM", endTime: "2:00 PM", location: "Town Circle", status: "Upcoming" },
      { title: "Annual General Meeting", description: "Review meeting", date: new Date("2026-09-15"), startTime: "6:00 PM", endTime: "8:00 PM", location: "Community Hall", status: "Upcoming" },
    ]);

    await Notification.insertMany([
      { title: "Welcome to Ganapathi Utsav 2026", message: "Welcome!", type: "General", targetAudience: "All Members", date: randomDate(30), read: true },
      { title: "Payment Reminder", message: "Clear dues before Aug 25th.", type: "Payment Reminder", targetAudience: "All Members", date: randomDate(15) },
      { title: "Volunteers Needed", message: "Contact coordinator for Aug 28th.", type: "Event", targetAudience: "All Members", date: randomDate(10) },
      { title: "Weather Alert", message: "Heavy rains expected Sep 5th.", type: "Emergency", targetAudience: "All Members", date: randomDate(5) },
      { title: "Thank You Sponsors", message: "Thank you for your support!", type: "General", targetAudience: "Sponsors", date: randomDate(3) },
      { title: "Final Payment Reminder", message: "Last chance to clear dues.", type: "Payment Reminder", targetAudience: "All Members", date: randomDate(1) },
    ]);

    res.json({ message: "✅ Database seeded successfully!", counts: {
      payments: 15, expenses: 10, sponsors: 8, activities: 6, notifications: 6
    }});
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ message: "Seed failed: " + err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

const start = async () => {
  // Accept either MONGO_URI or MONGODB_URI (Render may set either)
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (mongoUri) {
    // Ensure database name is in the connection string
    let uri = mongoUri;
    if (!uri.includes("/agraja-sangam")) {
      uri = uri.replace(/\?.*$/, ""); // strip any query params temporarily
      uri = uri.endsWith("/") ? uri + "agraja-sangam" : uri + "/agraja-sangam";
      // Re-append original query params if any
      const origQuery = mongoUri.split("?")[1];
      if (origQuery) uri += "?" + origQuery;
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
    });
    console.log("MongoDB connected");

    // If running in development and there are no users, seed fallback admin/member
    // Note: User model's pre('save') hook auto-hashes passwords, so we pass plaintext here
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log("No users found — seeding default users (admin/member)");

        await User.create([
          { username: "admin", password: "admin123", role: "Admin" },
          { username: "member", password: "member123", role: "Member" },
        ]);

        console.log("✅ Default users created: admin/member");
      } else {
        console.log(`Found ${userCount} existing users — skipping seed`);
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
