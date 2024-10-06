import { check, ValidationChain } from "express-validator";
import { executeQuery } from "../utils/databaseAdapter";

export const userValidationRules: ValidationChain[] = [
  check("name").notEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Valid email is required"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("type")
    .isIn(["admin", "customer"])
    .withMessage("Type must be either admin or customer"),
];

export const validateUserAssignment = async (req: any, res: any, next: any) => {
  const { userId } = req.body;
  const ticketId = req.params.ticketId;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userQuery = `SELECT * FROM users WHERE id = :userId`;
    const user = await executeQuery(userQuery, { userId });

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (user.type === "admin") {
      return res
        .status(403)
        .json({ message: "Cannot assign a ticket to an admin" });
    }

    const ticketQuery = `SELECT * FROM tickets WHERE id = :ticketId`;
    const ticket = await executeQuery(ticketQuery, { ticketId });

    if (!ticket || ticket.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status === "closed") {
      return res
        .status(400)
        .json({ message: "Cannot assign users to a closed ticket" });
    }

    const assignmentQuery = `
      SELECT * FROM ticket_users WHERE "userId" = :userId AND "ticketId" = :ticketId;
    `;

    const isUserAssigned = await executeQuery(assignmentQuery, {
      userId,
      ticketId,
    });

    if (isUserAssigned && isUserAssigned.length > 0) {
      return res
        .status(400)
        .json({ message: "User already assigned to this ticket" });
    }

    const countQuery = `
        SELECT COUNT(*) as count FROM ticket_users WHERE "ticketId" = :ticketId;
      `;
    const assignedCountResult = await executeQuery(countQuery, { ticketId });

    const assignedCount = assignedCountResult.count;

    if (assignedCount >= 5) {
      return res.status(400).json({ message: "User assignment limit reached" });
    }

    if (ticket.created_by !== req.user.id && req.user.type !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized to assign users to this ticket" });
    }

    next();
  } catch (error) {
    console.error("Error validating user assignment:", error);
    res.status(500).json({
      message: "An error occurred while validating the user assignment",
    });
  }
};
