import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import User from "./user";
import TicketUser from "./ticket_user";

interface TicketAttributes {
  id: number;
  title: string;
  description: string;
  type: string;
  venue: string;
  status: "open" | "in-progress" | "closed";
  price: number;
  priority: "low" | "medium" | "high";
  dueDate: Date;
  created_by: number;
}

interface TicketCreationAttributes extends Omit<TicketAttributes, "id"> {}

class Ticket
  extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes
{
  public id!: number;
  public title!: string;
  public description!: string;
  public type!: string;
  public venue!: string;
  public status!: "open" | "in-progress" | "closed";
  public price!: number;
  public priority!: "low" | "medium" | "high";
  public dueDate!: Date;
  public created_by!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    venue: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("open", "in-progress", "closed"),
      allowNull: false,
    },
    price: { type: DataTypes.FLOAT, allowNull: false },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
    },
    dueDate: { type: DataTypes.DATE, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: "Ticket",
    tableName: "tickets",
    timestamps: true,
  }
);

Ticket.belongsTo(User, { foreignKey: "created_by" });
User.hasMany(Ticket, { foreignKey: "created_by" });

Ticket.belongsToMany(User, {
  through: TicketUser,
  foreignKey: "ticketId",
});
User.belongsToMany(Ticket, {
  through: TicketUser,
  foreignKey: "userId",
});

export default Ticket;
