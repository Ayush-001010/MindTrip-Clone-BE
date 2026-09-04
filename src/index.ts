import express from "express";

import User  from "./models/User";
import authRoutes from "./routes/authRoutes";
import passport from "./config/passport";
import cors from "cors";
import sequelize from "./DB/dbConfig";
import homeRoutes from "./Routes/Home";
import dotenv from "dotenv";

import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";

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
app.use(cors({ origin: "*" }));

app.use("/home", homeRoutes);

const testingFunction = async () => {
  try {
    const client = new CopilotClient({
      connection: RuntimeConnection.forUri("localhost:4321"),
      mode: "empty",
    });

    const session = await client.createSession({
      sessionId: `user-123-${Date.now()}`,
      model: "gpt-5.4-mini",
      availableTools: [],
    });

    const response = await session.sendAndWait({
      prompt: `Summarize this support request:

Customer says the login page keeps redirecting after entering correct credentials.
This issue started after yesterday's deployment.
It affects Safari users mostly.
Priority is high because multiple customers reported it.
`,
    });

    console.log(response?.data.content);
    await client.stop();
  } catch (error) {
    console.error("Copilot SDK error:", error);
  }
};

testingFunction();

app.listen(port, () => {
  sequelize.sync().then(() => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
