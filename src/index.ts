import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import sequelize from "./DB/dbConfig";
import { initSocket } from "./Socket/socketOpt";
import homeRoutes from "./Routes/Home";
import commonRoutes from "./Routes/Common";
import authRoutes from "./Routes/authRoutes";
import hotelRoutes from "./Routes/hotelRoutes";
import placeRoutes from "./Routes/placeRoutes";
import tripRoutes from "./Routes/tripRoutes";

import passport from "./Config/passport";
import inviteRoutes from "./Routes/InviteRoutes";


const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(passport.initialize());
app.use("/", inviteRoutes);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

initSocket(io);

app.use("/api/auth", authRoutes);
app.use("/api/explore", hotelRoutes);
app.use("/api/explore", placeRoutes);
app.use("/home", homeRoutes);
app.use("/common", commonRoutes);
app.use("/trip", tripRoutes);


app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});


sequelize.sync().then(() => {
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});