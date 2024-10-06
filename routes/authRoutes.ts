import express from "express";
import { login } from "../controllers/authController";

const router = express.Router();

router.post("/auth/login", login);

export default router;
