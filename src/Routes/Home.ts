import { Router } from "express";
import rateLimiterMiddleware from "../Middleware/RateLimitter";
import { exploreTrip } from "../Controller/Home";
import { exploreTripValidation } from "../Validation/HomeValidation";
import { authenticateToken } from "../Middleware/authMiddleware";

const route = Router();

route.get(
    "/exploreTrip",
    authenticateToken,
    rateLimiterMiddleware,
    exploreTripValidation,
    exploreTrip
  );

export default route;
