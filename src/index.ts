import express from "express";
import rateLimiterMiddleware from "./Middleware/RateLimitter";
import sequelize from "./DB/dbConfig";
import homeRoutes from "./Routes/Home";
import dotenv from "dotenv";
import models from "./DB/model";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", rateLimiterMiddleware, (req, res) => {
  res.send("Hello, World!");
});

app.use("/home", homeRoutes);


app.listen(port, () => {
  sequelize.sync().then(() => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
