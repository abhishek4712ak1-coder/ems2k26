import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js"
import OTP from "../models/otp.model.js";
import Student from "../models/student.model.js";
import { sendRegistrationOTP, sendPasswordResetOTP } from "../config/nodemailer.js";

const OTP_EXPIRES_IN = 5;
const OTP_ATTEMPTS = 5;

const generateOTP = () => {
    return crypto
        .randomInt(100000, 1000000)
        .toString();
};

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};


const normalizeEmail = (email) => {
    return String(email || "")
        .trim()
        .toLowerCase();
};

const AUTH_COOKIE = "zest_user";

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
};

const setAuthCookie = (res, token) => {
    res.cookie(AUTH_COOKIE, token, cookieOptions);
};

const clearAuthCookie = (res) => {
    res.clearCookie(AUTH_COOKIE, {
        ...cookieOptions,
        maxAge: 0,
    });
};

export const sendRegisterOTP = async (req, res, next) => {
    try {

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "All fields are required.",
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 8 characters.",
            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        // Basic email validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address.",
            });
        }
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists.",
            });
        }
        const otp = generateOTP();

        const salt = await bcrypt.genSalt(12)
        const [hashedPassword, hashedOtp] = await Promise.all([
            bcrypt.hash(password, salt),
            bcrypt.hash(otp, salt),
        ]);

        await OTP.deleteMany({
            email: normalizedEmail,
            purpose: "register",
        });

        const expiresAt = new Date(
            Date.now() +
            OTP_EXPIRES_IN * 60 * 1000
        );

        await OTP.create({
            email: normalizedEmail,
            otp: hashedOtp,
            purpose: "register",
            attempts: 0,

            passwordHash: hashedPassword,

            expiresAt,

            verified: false,
        });

        try {
            await sendRegistrationOTP({
                to: normalizedEmail,

                otp,

                userName: email,
            });
        } catch (emailError) {
            // If email failed, remove OTP
            await OTP.deleteMany({
                email: normalizedEmail,
                purpose: "register",
            });

            throw emailError;
        }

        return res.status(200).json({
            success: true,

            message:
                "OTP sent successfully to your email.",

            data: {
                email: normalizedEmail,

                expiresIn:
                    `${OTP_EXPIRES_IN} minutes`,
            },
        });

    } catch (error) {
        console.log(`error in sendRegiterOTP ${error}`);
        next(error);
    }
}

export const verifyRegisterOTP = async (
    req,
    res,
    next
) => {
    try {
        const {
            email,
            otp,
        } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and OTP are required.",
            });
        }

        const normalizedEmail =
            normalizeEmail(email);

        const otpRecord = await OTP.findOne({
            email: normalizedEmail,
            purpose: "register",
            verified: false,
        })
            .select(
                "+otp +passwordHash"
            )
            .sort({
                createdAt: -1,
            });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP not found or has expired.",
            });
        }

        if (
            otpRecord.attempts >=
            OTP_ATTEMPTS
        ) {
            await OTP.deleteOne({
                _id: otpRecord._id,
            });

            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        const isValidOTP =
            await bcrypt.compare(
                String(otp),
                otpRecord.otp
            );

        if (!isValidOTP) {
            otpRecord.attempts += 1;

            await otpRecord.save();

            const remaining =
                OTP_ATTEMPTS -
                otpRecord.attempts;

            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP.",

                remainingAttempts:
                    remaining,
            });
        }

        const existingUser =
            await User.findOne({
                email: normalizedEmail,
            });

        if (existingUser) {
            await OTP.deleteOne({
                _id: otpRecord._id,
            });

            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists.",
            });
        }

        const user = await User.create({
            email: normalizedEmail,
            password: otpRecord.passwordHash,
            role: "user",
            isVerified: true,
        })


        await OTP.deleteOne({
            _id: otpRecord._id,
        });

        const token = generateToken(user);


        setAuthCookie(
            res,
            token
        );


        return res.status(201).json({
            success: true,

            message:
                "Registration successful. Welcome to ZET 2K26! 🎉",

            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                },
            },
        });
    } catch (error) {
        console.log(`error in verifyRegisterOTP ${error}`)
        next(error);
    }
};


export const login = async (
    req,
    res,
    next
) => {
    try {
        const {
            email,
            password,
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required.",
            });
        }

        const normalizedEmail = normalizeEmail(email);


        const user =
            await User.findOne({
                email: normalizedEmail,
            }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email ",
            });
        }


        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message:
                    "Please verify your email before logging in.",
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid password.",
            });
        }

        const token = generateToken(user);

        setAuthCookie(
            res,
            token
        );


        return res.status(200).json({
            success: true,

            message:
                "Login successful. Welcome back! 🎉",

            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
            }
        })
    }
    catch (error) {
        next(error);
    }
};

export const logout = async (
    req,
    res,
    next
) => {
    try {
        clearAuthCookie(res);

        return res.status(200).json({
            success: true,

            message:
                "Logged out successfully. See you at ZET 2K26! 👋",
        });
    } catch (error) {
        next(error);
    }
};


export const getMe = async (req, res) => {
    try {
        const token = req.cookies.zest_user;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found.",
            });
        }

        const student = await Student.findOne({ email: user.email });

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    hasProfile: Boolean(student),
                    name: student?.name || "",
                },
            },
        });
    } catch (error) {
        console.error("getMe error:", error);
        return res.status(401).json({
            success: false,
            message: "Your session is invalid or has expired. Please log in again.",
        });
    }
};




export const sendForgotPasswordOTP = async (req,res) => {
    try {
        
        const { email } = req.body;
        if (!email) { return res.status(400).json({ success: false, message: "Email is required", }); }

        const user = await User.findOne({email});
        if (!user) { 
            return res.status(200).json({ success: true, message: "Account with this mail not exists. Register now...", }); 
        }

        await OTP.deleteMany({ email, purpose: "forgot-password", });

        const otp = crypto.randomInt( 100000, 1000000 ).toString();

        const otpHash = await bcrypt.hash( otp, 10 );

        const expiresAt = new Date( Date.now() + 5 * 60 * 1000 );

        await OTP.create({ email, otp:otpHash, purpose: "forgot-password", expiresAt, attempts: 0, verified: false });

        await sendPasswordResetOTP({ to: email, otp, userName: user.email });

        return res.status(200).json({ success: true, message: "An  OTP has been sent. Check the inbox", });
    } 
    catch (error) { 
        console.error( "Send forgot password OTP error:", error ); 
        return res.status(500).json({ success: false, message: "Unable to process password reset request", }); 
    } 
};

export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // Clean OTP
    const cleanOTP = String(otp).trim();

    // Validate OTP format
    if (!/^\d{6}$/.test(cleanOTP)) {
      return res.status(400).json({
        success: false,
        message: "OTP must contain 6 digits",
      });
    }
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      purpose: "forgot-password",
      verified: false,
      expiresAt: {
        $gt: new Date(),
      },
    }).select("+otp");

    // OTP not found / expired
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or has expired",
      });
    }

    // Maximum attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // Compare entered OTP with hashed OTP
    const isValid = await bcrypt.compare(
      cleanOTP,
      otpRecord.otp
    );

    // Invalid OTP
    if (!isValid) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: Math.max(
          0,
          5 - otpRecord.attempts
        ),
      });
    }

    // OTP verified
    otpRecord.verified = true;

    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error(
      "Verify forgot password OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  }
};

export const resetPassword = async ( req, res ) => { 
    try { 
        const { email, password, confirmPassword, } = req.body; 
        if ( !email || !password || !confirmPassword ) { 
            return res.status(400).json({ success: false, message: "Email, password and confirm password are required", }); 
        }

        if (password.length < 8) { 
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters", }); 
        } 
        if (password !== confirmPassword) { 
            return res.status(400).json({ success: false, message: "Passwords do not match", }); 
        }

        const verifiedOTP = await OTP.findOne({ email, purpose: "forgot-password", verified: true, }); 
        if (!verifiedOTP) { 
            return res.status(400).json({ success: false, message: "Please verify your OTP before resetting your password", }); 
        }

        const user = await User.findOne({ email }).select("+password"); 
        if (!user) { 
            return res.status(400).json({ success: false, message: "Unable to reset password", }); 
        }

        const passwordHash = await bcrypt.hash( password, 12 ); 
        user.password = passwordHash; 
        await user.save();

        await OTP.deleteOne({ _id: verifiedOTP._id, }); 
        return res.status(200).json({ success: true, message: "Password reset successfully. Please login with your new password.", }); 
    } catch (error) { 
        console.error( "Reset password error:", error ); 
        return res.status(500).json({ success: false, message: "Unable to reset password", }); 
    }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password and confirm password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    const user = await User.findById(req.user.userId).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);

    if (!matches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};
