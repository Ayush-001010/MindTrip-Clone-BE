import { Router } from "express";

import { getPlaces } from "../Controller/PlaceController";
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