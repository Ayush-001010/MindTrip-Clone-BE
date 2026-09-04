import { Router } from "express";
import rateLimiterMiddleware from "../Middleware/RateLimitter";
import { exploreTrip } from "../Controller/Home";
import { exploreTripValidation } from "../Validation/HomeValidation";

const route = Router();

route.get("/exploreTrip", rateLimiterMiddleware , exploreTripValidation, exploreTrip);

export default route;
