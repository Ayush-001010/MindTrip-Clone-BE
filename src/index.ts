import express from "express";
import sequelize from "./DB/dbConfig";
import homeRoutes from "./Routes/Home";
import copilotRoutes from "./Routes/Copilot";
import dotenv from "dotenv";
import cors from "cors";
import commonRoutes from "./Routes/Common";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cors({ origin: "*" }));

app.use("/home", homeRoutes);
app.use("/copilot", copilotRoutes);
app.use("/common", commonRoutes);

app.listen(port, () => {
  sequelize.sync().then(() => {
    console.log(`Server running at http://localhost:${port}`);
  });
});