import express from "express";
import sequelize from "./DB/dbConfig";
import homeRoutes from "./Routes/Home";
import dotenv from "dotenv";
import cors from "cors";
import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
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