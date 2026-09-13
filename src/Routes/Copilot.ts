import { Router } from "express";
import { fetchTripChat, TripItinerary } from "../Controller/Copilot";
import { tripItineraryValidation, fetchTripChatValidation } from "../Validation/CopilotValidation";

const route = Router();

route.post("/ItineraryChat",tripItineraryValidation, TripItinerary);
route.post("/fetchTripChat",fetchTripChatValidation, fetchTripChat);

export default route;