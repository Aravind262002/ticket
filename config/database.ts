import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL || "", {
  dialect: "postgres",
  logging: true
});

const connectToDB = async (): Promise<void> => {
  try {
    await sequelize.sync();
    console.log("Authentication successful");
  } catch (error) {
    console.error("An error occurred in DB connection:", error);
  }
};

const closeDB = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log("DB connection is closed successfully");
  } catch (error) {
    console.error("An error occurred in closing DB connection:", error);
  }
};

export { sequelize, connectToDB, closeDB };
