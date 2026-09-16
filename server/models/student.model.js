import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    pid: {
      type: String,
      required: true,
      unique: true,
    },
    rollno: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    accomodation: {
      type: String,
      required: true,
      enum: ["Hosteller", "Non Hosteller"],
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    college: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    idCardPath: {
      type: String,
      default: "",
    },
    idCardOriginalName: {
      type: String,
      default: "",
    },
    verified: {
      type: Number,
      default: 0,
    },
    verifiedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Students", studentSchema, "students");
