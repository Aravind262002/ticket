import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import User from "./user";
import Ticket from "./ticket";

interface TicketUserAttributes {
  id: number;
  userId: number;
  ticketId: number;
}

interface TicketUserCreationAttributes
  extends Omit<TicketUserAttributes, "id"> {}

class TicketUser
  extends Model<TicketUserAttributes, TicketUserCreationAttributes>
  implements TicketUserAttributes
{
  public id!: number;
  public userId!: number;
  public ticketId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TicketUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Ticket,
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "TicketUser",
    tableName: "ticket_users",
    timestamps: true,
  }
);

export default TicketUser;
