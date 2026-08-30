import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";
import User  from "./models/User";
import authRoutes from "./routes/authRoutes";
dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
    });
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected successfully");

        await sequelize.sync();
        console.log("Database tables synced successfully");

        app.listen(port, () => {
            console.log(`Server listening on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error);
    }
};

startServer();
