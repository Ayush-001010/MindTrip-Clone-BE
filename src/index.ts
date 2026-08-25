import express from "express";
import rateLimiterMiddleware from "./Middleware/RateLimitter";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", rateLimiterMiddleware, (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
