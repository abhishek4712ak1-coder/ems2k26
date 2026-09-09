import express from "express";
import { studentRegister, getData, getDashboard } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  uploadIdCard,
  handleUploadError,
} from "../middleware/upload.middleware.js";

const routerS = express.Router();

routerS.get("/profile", requireAuth, getData);
routerS.get("/dashboard", requireAuth, getDashboard);

routerS.post(
  "/register",
  requireAuth,
  uploadIdCard.single("idCard"),
  handleUploadError,
  studentRegister
);

export default routerS;
