import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const email = process.env.DEMO_ADMIN_EMAIL || "admin@zest2k26.test";
const password = process.env.DEMO_ADMIN_PASSWORD || "ZestAdmin@2026";

if (!process.env.DB_URL) {
  throw new Error("DB_URL is required to create the demo admin.");
}

await mongoose.connect(process.env.DB_URL);

const passwordHash = await bcrypt.hash(password, 12);
await User.findOneAndUpdate(
  { email },
  {
    email,
    password: passwordHash,
    role: "admin",
    isVerified: true,
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

console.log(`Demo admin ready: ${email}`);
await mongoose.disconnect();
