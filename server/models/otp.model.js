
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
      select: false,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    purpose: {
      type: String,
      enum: [
        "register",
        "forgot-password",
        "change-email",
      ],
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model(
  "OTP",
  otpSchema
);
