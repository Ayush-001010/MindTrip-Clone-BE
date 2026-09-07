import express from "express";
import User  from "./models/User";
import passport from "./config/passport";
import cors from "cors";
import sequelize from "./DB/dbConfig";
import homeRoutes from "./Routes/Home";
import copilotRoutes from "./Routes/Copilot";
import dotenv from "dotenv";
<<<<<<< HEAD
import cors from "cors";
import commonRoutes from "./Routes/Common";
=======
import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";
import authRoutes from "./Routes/authRoutes";
import hotelRoutes from "./Routes/hotelRoutes";
import placeRoutes from "./Routes/placeRoutes";
>>>>>>> 89223b9231a53a99b800062253fe3a784fb7e081

dotenv.config();

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);
app.use(passport.initialize());
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/explore", hotelRoutes);
app.use("/api/explore", placeRoutes);
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
    });
});


// const startServer = async () => {
//     try {
//         await sequelize.authenticate();
//         console.log("Database connected successfully");

//         await sequelize.sync();
//         console.log("Database tables synced successfully");

//         app.listen(port, () => {
//             console.log(`Server listening on http://localhost:${port}`);
//         });
//     } catch (error) {
//         console.error("Unable to start server:", error);
//     }
// };

// startServer();
app.use(cors({ origin: "*" }));

app.use("/home", homeRoutes);
app.use("/copilot", copilotRoutes);
app.use("/common", commonRoutes);

app.listen(port, () => {
  sequelize.sync().then(() => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
