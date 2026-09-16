import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import {
	createEvent,
	deleteEvent,
	getAdminOverview,
	getParticipationReport,
	getStudentReport,
	listEvents,
	listStudents,
	updateEvent,
	verifyStudent,
} from "../controllers/admin.controller.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/overview", getAdminOverview);
router.get("/students", listStudents);
router.get("/students/report/:value", getStudentReport);
router.patch("/students/:id/verify", verifyStudent);
router.get("/events", listEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);
router.get("/participation", getParticipationReport);

export default router;
