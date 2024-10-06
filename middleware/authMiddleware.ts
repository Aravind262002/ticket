import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { executeQuery } from "../utils/databaseAdapter";

export const authenticate = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET!, async (err: any, decoded: any) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    const query = `
      SELECT * FROM users WHERE id = :userId;
    `;

    try {
      const result = await executeQuery(query, { userId: decoded.userId });

      if (!result || result.length === 0)
        return res.status(401).json({ message: "User not found" });

      req.user = result;
      next();
    } catch (error: any) {
      console.error("Database query error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
};
