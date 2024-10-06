import express from "express";
import {
  assignUserToTicket,
  createTicket,
  getAllTickets,
  getTicketAnalytics,
  getTicketById,
  getTicketHistory,
} from "../controllers/ticketController";
import { ticketValidationRules } from "../validators/ticketValidator";
import { authenticate } from "../middleware/authMiddleware";
import { validateUserAssignment } from "../validators/userValidator";

const router = express.Router();
router.post("/tickets", authenticate, ticketValidationRules, createTicket);

router.post(
  "/tickets/:ticketId/assign",
  authenticate,
  validateUserAssignment,
  assignUserToTicket
);

router.get("/tickets", getAllTickets);

router.get("/tickets/history", authenticate, getTicketHistory);
router.get("/tickets/analytics", authenticate, getTicketAnalytics);


router.get("/tickets/:id", getTicketById);

export default router;
