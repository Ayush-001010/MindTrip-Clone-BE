import { Router } from "express";

import { getPlaces } from "../controllers/placeController";
import { authenticateToken } from "../Middleware/authMiddleware";
import rateLimiterMiddleware from "../Middleware/RateLimitter";

const router = Router();

router.get(
  "/places",
  authenticateToken,
  rateLimiterMiddleware,
  getPlaces
);

export default router;