import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { executeQuery } from "../utils/databaseAdapter";

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, password, type } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (name, email, password, type, "createdAt", "updatedAt")
      VALUES (:name, :email, :password, :type, NOW(), NOW())
      RETURNING id, name, email;
    `;

    const result = await executeQuery(query, {
      name,
      email,
      password: hashedPassword,
      type,
    });

    if (result && result.length > 0) {
      res
        .status(201)
        .json({ id: result.id, name: result.name, email: result.email });
    } else {
      res.status(400).json({ error: "User could not be created." });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
