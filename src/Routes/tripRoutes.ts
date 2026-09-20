import { Router } from "express";
import { createNewTripValidation, fetchTripMemberDetailsValidation, createUserInviteValidation, fetchFinalItineraryValidation ,validateUserInviteValidation, joinTripValidation} from "../Validation/TripValidation";
import { createNewTrip,  fetchTripMemberDetails, createUserInvite, fetchFinalItinerary ,validateUserInvite, joinTrip} from "../Controller/Trip";


const router = Router();

router.post("/createNewTrip" , createNewTripValidation , createNewTrip);
router.post("/fetchTripMemberDetails" , fetchTripMemberDetailsValidation , fetchTripMemberDetails);
router.post("/createUserInvite" , createUserInviteValidation , createUserInvite);
router.post("/fetchFinalItinerary" , fetchFinalItineraryValidation , fetchFinalItinerary);
router.post( "/validateUserInvite", validateUserInviteValidation,validateUserInvite);
router.post(
    "/joinTrip",
    joinTripValidation,
    joinTrip
);
export default router;