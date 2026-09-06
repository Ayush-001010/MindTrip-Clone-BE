import { Router } from "express";
import { TripItinerary } from "../Controller/Copilot";

const route = Router();

route.post("/ItineraryChat",TripItinerary);

export default route;