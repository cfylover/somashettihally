// Run once: node seedUsers.js
// Creates default Admin and Member users for login.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const users = [
  {
    username: "admin",
    password: "admin123",
    role: "Admin",
  },
  {
    username: "member",
    password: "member123",
    role: "Member",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    for (const u of users) {
      const exists = await User.findOne({ username: u.username });
      if (exists) {
        console.log(`⚠️ User "${u.username}" already exists`);
      } else {
        const newUser = new User(u);
        await newUser.save();
        console.log(`✅ Created user "${u.username}" with role "${u.role}"`);
      }
    }

    console.log("🎉 Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seed();
