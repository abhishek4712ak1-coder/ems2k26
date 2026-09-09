import express from "express";

import {
  sendRegisterOTP,
  verifyRegisterOTP,
  login,
  logout,
  getMe,
  sendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();    

router.post(
  "/register/send-otp",
  sendRegisterOTP
);

router.post(
  "/register/verify-otp",
  verifyRegisterOTP
);

router.post(
  "/login",
  login
);

router.post(
  "/logout",
  logout
);

router.get(
  "/me",
  getMe
);

router.post( "/forgot-password/send-otp", sendForgotPasswordOTP ); 
router.post( "/forgot-password/verify-otp", verifyForgotPasswordOTP ); 
router.post( "/reset-password", resetPassword );
router.post("/change-password", requireAuth, changePassword);

export default router;
