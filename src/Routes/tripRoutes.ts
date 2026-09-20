import { Router } from "express";
import { createNewTripValidation, fetchTripMemberDetailsValidation, createUserInviteValidation, fetchFinalItineraryValidation ,validateUserInviteValidation} from "../Validation/TripValidation";
import { createNewTrip,  fetchTripMemberDetails, createUserInvite, fetchFinalItinerary ,validateUserInvite} from "../Controller/Trip";


const router = Router();

router.post("/createNewTrip" , createNewTripValidation , createNewTrip);
router.post("/fetchTripMemberDetails" , fetchTripMemberDetailsValidation , fetchTripMemberDetails);
router.post("/createUserInvite" , createUserInviteValidation , createUserInvite);
router.post("/fetchFinalItinerary" , fetchFinalItineraryValidation , fetchFinalItinerary);

router.post( "/validateUserInvite", validateUserInviteValidation,validateUserInvite);
export default router;