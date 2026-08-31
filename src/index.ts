import express from "express";
import rateLimiterMiddleware from "./Middleware/RateLimitter";
import sequelize from "./DB/dbConfig";
import homeRoutes from "./Routes/Home";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
// Please add cors

const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cors({ origin: "*" }));


app.use("/home", homeRoutes);


app.listen(port, () => {
  sequelize.sync().then(() => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
