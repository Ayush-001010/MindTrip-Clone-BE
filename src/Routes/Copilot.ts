import { Router } from "express";

import { fetchTripChat, TripItinerary } from "../Controller/Copilot";

import {
  tripItineraryValidation,
  fetchTripChatValidation,
} from "../Validation/CopilotValidation";

import { authenticateToken } from "../Middleware/authMiddleware";
import rateLimiterMiddleware from "../Middleware/RateLimitter";

const route = Router();

route.post(
  "/ItineraryChat",
  // authenticateToken,
  // rateLimiterMiddleware,
  tripItineraryValidation,
  TripItinerary
);

route.post(
  "/fetchTripChat",
  // authenticateToken,
  // rateLimiterMiddleware,
  fetchTripChatValidation,
  fetchTripChat
);

export default route;