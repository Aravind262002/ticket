import express from "express";
import { createUser } from "../controllers/userController";
import { userValidationRules } from "../validators/userValidator";
import { handleValidationErrors } from "../middleware/validationMiddleware";

const router = express.Router();

router.post("/users", userValidationRules, handleValidationErrors, createUser);

export default router;
