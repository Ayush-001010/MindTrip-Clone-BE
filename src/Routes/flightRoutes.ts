
import { Router } from "express";
import FlightController from "../Controller/FlightController";

const router = Router();
const flightController = new FlightController();

router.get("/airport", flightController.searchAirport);
router.get("/search", flightController.searchFlights);

export default router;
