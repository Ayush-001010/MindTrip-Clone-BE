import { Router } from "express";
import { createNewTripValidation, fetchTripDetailsValidation } from "../Validation/TripValidation";
import { createNewTrip } from "../Controller/Trip";

const router = Router();

router.post("/createNewTrip" , createNewTripValidation , createNewTrip);

export default router;