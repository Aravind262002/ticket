import { validationResult } from "express-validator";

export const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  console.log("this is error", errors);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
