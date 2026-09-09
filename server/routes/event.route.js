import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getIndividualEvents,
  getTeamEvents,
  checkPID,
  saveIndividualEvents,
  saveTeam,
  getInvitation,
  addVerifiedMember,
  delInvitation,
  delTeam,
  individualParticipation,
  teamParticipation,
} from "../controllers/event.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/individual", getIndividualEvents);
router.get("/team", getTeamEvents);
router.post("/check-pid", checkPID);
router.post("/individual", saveIndividualEvents);
router.post("/team", saveTeam);
router.get("/invitations", getInvitation);
router.post("/invitations/accept", addVerifiedMember);
router.post("/invitations/reject", delInvitation);
router.post("/team/delete", delTeam);
router.get("/participation/individual", individualParticipation);
router.get("/participation/team", teamParticipation);

export default router;
