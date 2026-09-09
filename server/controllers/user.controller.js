import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import Count from "../models/count.model.js";
import jwt from "jsonwebtoken";
import { sendStudentVerificationEmail } from "../config/nodemailer.js";

const trimValue = (value) => String(value ?? "").trim();

const nextParticipantId = async () => {
  const countDoc = await Count.findOneAndUpdate(
    { name: "studentCount" },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  return `P${countDoc.count}`;
};

const serializeStudent = (student) => ({
  email: student.email,
  pid: student.pid,
  rollno: student.rollno,
  name: student.name,
  phone: student.phone,
  address: student.address,
  college: student.college,
  branch: student.branch,
  year: student.year,
  verified: student.verified,
  gender: student.gender,
  accomodation: student.accomodation,
  hasIdCard: Boolean(student.idCardPath),
});

const parseProfileFields = (body) => {
  const rollno = trimValue(body.rollno);
  const name = trimValue(body.name);
  const phone = trimValue(body.phone);
  const address = trimValue(body.address);
  const gender = trimValue(body.gender);
  const accomodation = trimValue(body.accomodation);
  const college = trimValue(body.college);
  const branch = trimValue(body.branch);
  const year = Number(trimValue(body.year));

  return {
    rollno,
    name,
    phone,
    address,
    gender,
    accomodation,
    college,
    branch,
    year,
  };
};

const validateProfileFields = (fields) => {
  const required = [
    "rollno",
    "name",
    "phone",
    "address",
    "gender",
    "accomodation",
    "college",
    "branch",
  ];

  for (const key of required) {
    if (!fields[key]) {
      return "All profile fields are required.";
    }
  }

  if (!Number.isInteger(fields.year) || fields.year < 1 || fields.year > 5) {
    return "Year must be a number between 1 and 5.";
  }

  if (!["Hosteller", "Non Hosteller"].includes(fields.accomodation)) {
    return "Accommodation must be Hosteller or Non Hosteller.";
  }

  if (!/^[0-9]{10}$/.test(fields.phone)) {
    return "Phone number must be 10 digits.";
  }

  return null;
};

export const studentRegister = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const fields = parseProfileFields(req.body);
    const validationError = validateProfileFields(fields);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const existing = await Student.findOne({ email: user.email });

    if (existing) {
      const rollConflict = await Student.findOne({
        rollno: fields.rollno,
        _id: { $ne: existing._id },
      });

      if (rollConflict) {
        return res.status(409).json({
          success: false,
          message: "This student ID / roll number is already registered.",
        });
      }

      existing.set(fields);

      if (req.file?.path) {
        existing.idCardPath = req.file.path;
        existing.idCardOriginalName = req.file.originalname;
      }

      await existing.save();

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: serializeStudent(existing),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A photo of your student ID card is required.",
      });
    }

    const rollConflict = await Student.findOne({ rollno: fields.rollno });

    if (rollConflict) {
      return res.status(409).json({
        success: false,
        message: "This student ID / roll number is already registered.",
      });
    }

    const pid = await nextParticipantId();

    const student = await Student.create({
      pid,
      email: user.email,
      ...fields,
      idCardPath: req.file.path,
      idCardOriginalName: req.file.originalname,
      verified: 0,
    });

    try {
      await sendStudentVerificationEmail({
        student,
        idCardPath: req.file.path,
        idCardName: req.file.originalname,
      });
    } catch (mailError) {
      console.error("Student verification email failed:", mailError);
    }

    return res.status(201).json({
      success: true,
      message:
        "Profile created successfully. Your details and ID card were sent to the ZEST admin for verification.",
      data: serializeStudent(student),
    });
  } catch (error) {
    console.error("studentRegister error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A profile with these details already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to save profile. Please try again.",
    });
  }
};

export const getData = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const student = await Student.findOne({ email: user.email });

    if (!student) {
      return res.status(404).json({
        success: false,
        code: "PROFILE_NOT_FOUND",
        message: "Student profile has not been created yet.",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeStudent(student),
    });
  } catch (error) {
    console.error("getData error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load profile.",
    });
  }
};


export const getDashboard = async (req, res) => { 
    try { 
        const token = req.cookies.zest_user; 
        if (!token) { 
            return res.status(401).json({ 
                success: false, message: "Unauthorized", 
            }
        ); 
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    const emailToken = decoded.email;
    if (!emailToken) { 
        return res.status(401).json({ success: false, message: "Invalid authentication token"}); 
    } 
    const student = await Student.findOne({ email: emailToken, }).lean(); 
    if (!student) { 
        return res.status(200).json({ success: true, data: { student: null}}); 
    } 
    return res.status(200).json({ success: true, data: { student}}); 
} 
catch (error) { 
    console.error("Error in getDashboard:", error); 
    if ( error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" ) { 
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token", }); 
    } 
    return res.status(500).json({ success: false, message: "Unable to get dashboard data", }); 
}
};