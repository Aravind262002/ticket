import { check, ValidationChain } from "express-validator";

export const ticketValidationRules: ValidationChain[] = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("type").notEmpty().withMessage("Type is required"),
  check("venue").notEmpty().withMessage("Venue is required"),
  check("dueDate").isISO8601().withMessage("Valid due date is required"),
];
