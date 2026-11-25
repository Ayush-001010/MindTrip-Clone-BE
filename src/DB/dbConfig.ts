import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "mindTrip",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD ?? "",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false,
  }
);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD loaded:", Boolean(process.env.DB_PASSWORD));
export default sequelize;