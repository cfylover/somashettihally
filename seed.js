// seed.js — run with: node seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/agraja-sangam";

// ─── Schemas (inline to avoid import path issues) ───────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Member"], default: "Member" },
}, { timestamps: true });
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const paymentSchema = new mongoose.Schema({
  receiptNumber: { type: String, unique: true, sparse: true },
  payerName: { type: String, required: true, trim: true },
  phone: { type: String, default: "", trim: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["Cash", "UPI", "Bank Transfer", "Other"], default: "Cash" },
  transactionId: { type: String, default: "" },
  paymentDate: { type: Date, default: Date.now },
  note: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
  category: { type: String, enum: ["Decoration", "Sound", "Food", "Lighting", "Flowers", "Security", "Transportation", "Others"], default: "Others" },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  paidTo: { type: String, default: "", trim: true },
  paymentMethod: { type: String, enum: ["Cash", "UPI", "Bank"], default: "Cash" },
  date: { type: Date, default: Date.now },
  description: { type: String, default: "", trim: true },
}, { timestamps: true });

const sponsorSchema = new mongoose.Schema({
  sponsorName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, default: "" },
  amount: { type: Number, required: true, min: 0, default: 0 },
  paymentMethod: { type: String, enum: ["Cash", "UPI", "Bank Transfer"], default: "Cash" },
  receiptNumber: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["Paid", "Pending"], default: "Pending" },
  notes: { type: String, default: "" },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  date: { type: Date, required: true },
  startTime: { type: String, default: "", trim: true },
  endTime: { type: String, default: "", trim: true },
  location: { type: String, default: "", trim: true },
  organizer: { type: String, default: "", trim: true },
  status: { type: String, enum: ["Upcoming", "Ongoing", "Completed"], default: "Upcoming" },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, default: "", trim: true },
  type: { type: String, enum: ["General", "Payment Reminder", "Event", "Emergency"], default: "General" },
  targetAudience: { type: String, enum: ["All Members", "Admins", "Sponsors"], default: "All Members" },
  date: { type: Date, default: Date.now },
  time: { type: String, default: "", trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Payment = mongoose.model("Payment", paymentSchema);
const Expense = mongoose.model("Expense", expenseSchema);
const Sponsor = mongoose.model("Sponsor", sponsorSchema);
const Activity = mongoose.model("Activity", activitySchema);
const Notification = mongoose.model("Notification", notificationSchema);

// ─── Mock Data ──────────────────────────────────────────────────────
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

const methods = ["Cash", "UPI", "Bank Transfer"];

const randomDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
  return d;
};

const seed = async () => {
  console.log("Connecting to", MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log("Connected ✅");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    Sponsor.deleteMany({}),
    Activity.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log("Cleared old data ✅");

  // ── Users ──
  await User.create([
    { username: "admin", password: "admin123", role: "Admin" },
    { username: "member", password: "member123", role: "Member" },
  ]);
  console.log("Seeded users ✅");

  // ── Payments (15 payments, mix of Paid/Pending) ──
  const payments = people.map((p, i) => ({
    receiptNumber: `AGS-2026-${String(i + 1).padStart(6, "0")}`,
    payerName: p.name,
    phone: p.phone,
    amount: [2500, 1500, 3000, 500, 2000, 2500, 1000, 4000, 2500, 750, 2500, 3500, 2000, 1500, 2500][i],
    paymentMethod: methods[i % 3],
    transactionId: i % 3 === 1 ? `TXN${100000 + i}` : "",
    paymentDate: randomDate(60),
    note: "",
    status: i < 10 ? "Paid" : "Pending",
  }));
  await Payment.insertMany(payments);
  console.log(`Seeded ${payments.length} payments ✅`);

  // ── Expenses (10 expenses across categories) ──
  const expenses = [
    { category: "Decoration", title: "Mandap Decoration", amount: 8500, paidTo: "Raju Decorators", paymentMethod: "Cash", date: randomDate(30), description: "Full mandap with flowers and lighting" },
    { category: "Sound", title: "DJ & Sound System", amount: 12000, paidTo: "Sonic Events", paymentMethod: "Bank", date: randomDate(25), description: "Full day DJ and PA system" },
    { category: "Food", title: "Prasad Preparation", amount: 15000, paidTo: "Annapurna Caterers", paymentMethod: "Cash", date: randomDate(20), description: "Laddu and meals for 500 people" },
    { category: "Lighting", title: "LED Light Setup", amount: 6500, paidTo: "Bright Solutions", paymentMethod: "UPI", date: randomDate(18), description: "Stage and pathway lighting" },
    { category: "Flowers", title: "Fresh Flower Garlands", amount: 4000, paidTo: "Phool Bazaar", paymentMethod: "Cash", date: randomDate(15), description: "Jasmine and marigold garlands" },
    { category: "Security", title: "Security Guards", amount: 5000, paidTo: "SafeGuard Services", paymentMethod: "Bank", date: randomDate(12), description: "4 guards for 2 days" },
    { category: "Transportation", title: "Idol Transport", amount: 3500, paidTo: "Ganesh Transport", paymentMethod: "Cash", date: randomDate(10), description: "Truck for idol and materials" },
    { category: "Decoration", title: "Arch Gate Setup", amount: 7000, paidTo: "Royal Events", paymentMethod: "UPI", date: randomDate(8), description: "Main entrance arch with lights" },
    { category: "Food", title: "Water & Beverages", amount: 2500, paidTo: "Reliance Mart", paymentMethod: "Cash", date: randomDate(5), description: "Water bottles and soft drinks" },
    { category: "Others", title: "Print Banners", amount: 3000, paidTo: "Print Hub", paymentMethod: "Cash", date: randomDate(3), description: "5 flex banners for the event" },
  ];
  await Expense.insertMany(expenses);
  console.log(`Seeded ${expenses.length} expenses ✅`);

  // ── Sponsors (8 sponsors) ──
  const sponsors = [
    { sponsorName: "Kiran Enterprises", phone: "9876500001", amount: 25000, paymentMethod: "Bank Transfer", status: "Paid", date: randomDate(45) },
    { sponsorName: "Patel Hardware", phone: "9876500002", amount: 15000, paymentMethod: "Cash", status: "Paid", date: randomDate(40) },
    { sponsorName: "Sharma Jewellers", phone: "9876500003", amount: 50000, paymentMethod: "Bank Transfer", status: "Paid", date: randomDate(35) },
    { sponsorName: "Gowda Traders", phone: "9876500004", amount: 10000, paymentMethod: "UPI", status: "Paid", date: randomDate(30) },
    { sponsorName: "Reddy Motors", phone: "9876500005", amount: 20000, paymentMethod: "Cash", status: "Paid", date: randomDate(25) },
    { sponsorName: "Bhat Financial", phone: "9876500006", amount: 30000, paymentMethod: "Bank Transfer", status: "Pending", date: randomDate(20) },
    { sponsorName: "Nayak Constructions", phone: "9876500007", amount: 18000, paymentMethod: "UPI", status: "Paid", date: randomDate(15) },
    { sponsorName: "Joshi Electronics", phone: "9876500008", amount: 12000, paymentMethod: "Cash", status: "Pending", date: randomDate(10) },
  ];
  await Sponsor.insertMany(sponsors);
  console.log(`Seeded ${sponsors.length} sponsors ✅`);

  // ── Activities (6 activities) ──
  const activities = [
    { title: "Ganesh Chaturthi Puja", description: "Main puja ceremony with Vedic chants", date: new Date("2026-08-27"), startTime: "6:00 AM", endTime: "9:00 AM", location: "Main Mandap", organizer: "Pandit Ramesh", status: "Upcoming" },
    { title: "Cultural Program - Day 1", description: "Classical music and dance performances", date: new Date("2026-08-28"), startTime: "5:00 PM", endTime: "9:00 PM", location: "Open Ground", organizer: "Cultural Committee", status: "Upcoming" },
    { title: "Ladies Sangeet Night", description: "Musical night for ladies", date: new Date("2026-08-29"), startTime: "7:00 PM", endTime: "11:00 PM", location: "Banquet Hall", organizer: "Women's Wing", status: "Upcoming" },
    { title: "Kids Fancy Dress", description: "Children's fancy dress competition", date: new Date("2026-08-30"), startTime: "4:00 PM", endTime: "6:00 PM", location: "Main Stage", organizer: "Youth Committee", status: "Upcoming" },
    { title: "Grand Procession", description: "Ganesh Visarjan procession through town", date: new Date("2026-09-06"), startTime: "8:00 AM", endTime: "2:00 PM", location: "Town Circle", organizer: "Procession Committee", status: "Upcoming" },
    { title: "Annual General Meeting", description: "Review of Utsav activities and finances", date: new Date("2026-09-15"), startTime: "6:00 PM", endTime: "8:00 PM", location: "Community Hall", organizer: "President", status: "Upcoming" },
  ];
  await Activity.insertMany(activities);
  console.log(`Seeded ${activities.length} activities ✅`);

  // ── Notifications (6 notifications) ──
  const notifications = [
    { title: "Welcome to Ganapathi Utsav 2026", message: "Shree Vinayaka Geleyara Balaga welcomes you to this year's celebration!", type: "General", targetAudience: "All Members", date: randomDate(30), read: true },
    { title: "Payment Reminder", message: "Please clear your pending contributions before Aug 25th.", type: "Payment Reminder", targetAudience: "All Members", date: randomDate(15), read: false },
    { title: "Cultural Program Volunteers Needed", message: "We need volunteers for the cultural program on Aug 28th. Please contact the coordinator.", type: "Event", targetAudience: "All Members", date: randomDate(10), read: false },
    { title: "Emergency: Weather Alert", message: "Heavy rains expected on Sep 5th. Procession may be rescheduled. Stay tuned.", type: "Emergency", targetAudience: "All Members", date: randomDate(5), read: false },
    { title: "Sponsorship Thank You", message: "Thank you to all our generous sponsors for supporting Ganapathi Utsav 2026!", type: "General", targetAudience: "Sponsors", date: randomDate(3), read: false },
    { title: "Final Reminder: Pending Payments", message: "Last chance to clear your dues before the final celebration day.", type: "Payment Reminder", targetAudience: "All Members", date: randomDate(1), read: false },
  ];
  await Notification.insertMany(notifications);
  console.log(`Seeded ${notifications.length} notifications ✅`);

  // Summary
  const totals = {
    users: await User.countDocuments(),
    payments: await Payment.countDocuments(),
    expenses: await Expense.countDocuments(),
    sponsors: await Sponsor.countDocuments(),
    activities: await Activity.countDocuments(),
    notifications: await Notification.countDocuments(),
  };
  console.log("\n📊 Seed Summary:", totals);
  console.log("\n✅ All data seeded successfully!");
  console.log("Login: admin / admin123 or member / member123");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
