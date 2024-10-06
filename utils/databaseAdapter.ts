import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";

export const executeQuery = async (
  query: string,
  replacements?: any
): Promise<any> => {
  try {
    const results = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return results;
  } catch (error) {
    throw new Error("Database query failed");
  }
};
