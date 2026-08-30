import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "MindTrip AI backend is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
    