import { Router } from "express";
import { createNewTripValidation, fetchTripMemberDetailsValidation, createUserInviteValidation, fetchFinalItineraryValidation } from "../Validation/TripValidation";
import { createNewTrip,  fetchTripMemberDetails, createUserInvite, fetchFinalItinerary } from "../Controller/Trip";

const router = Router();

router.post("/createNewTrip" , createNewTripValidation , createNewTrip);
router.post("/fetchTripMemberDetails" , fetchTripMemberDetailsValidation , fetchTripMemberDetails);
router.post("/createUserInvite" , createUserInviteValidation , createUserInvite);
router.post("/fetchFinalItinerary" , fetchFinalItineraryValidation , fetchFinalItinerary);

export default router;