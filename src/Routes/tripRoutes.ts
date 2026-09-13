import { Router } from "express";
import { createNewTripValidation, fetchTripMemberDetailsValidation, createUserInviteValidation } from "../Validation/TripValidation";
import { createNewTrip,  fetchTripMemberDetails, createUserInvite } from "../Controller/Trip";

const router = Router();

router.post("/createNewTrip" , createNewTripValidation , createNewTrip);
router.post("/fetchTripMemberDetails" , fetchTripMemberDetailsValidation , fetchTripMemberDetails);
router.post("/createUserInvite" , createUserInviteValidation , createUserInvite);

export default router;