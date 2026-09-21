import { Router } from "express";

import {
    createNewTripValidation,
    fetchTripMemberDetailsValidation,
    createUserInviteValidation,
    joinTripValidation,
    validateUserInviteValidation
} from "../Validation/TripValidation";

import {
    createNewTrip,
    fetchTripMemberDetails,
    createUserInvite,
    joinTrip,
    validateUserInvite
} from "../Controller/Trip";

import { authenticateToken } from "../Middleware/authMiddleware";

const router = Router();

router.post(
    "/createNewTrip",
    createNewTripValidation,
    createNewTrip
);

router.post(
    "/fetchTripMemberDetails",
    fetchTripMemberDetailsValidation,
    fetchTripMemberDetails
);

router.post(
    "/createUserInvite",
    createUserInviteValidation,
    createUserInvite
);

router.post(
    "/joinTrip",
    authenticateToken,
    joinTripValidation,
    joinTrip
);
router.post(
    "/validateUserInvite",
    validateUserInviteValidation,
    validateUserInvite
);
import { createNewTripValidation, fetchTripMemberDetailsValidation, createUserInviteValidation, fetchFinalItineraryValidation } from "../Validation/TripValidation";
import { createNewTrip,  fetchTripMemberDetails, createUserInvite, fetchFinalItinerary, fetchTripAnalytics, fetchTripExpenses } from "../Controller/Trip";

const router = Router();

router.post("/createNewTrip" , createNewTripValidation , createNewTrip);
router.post("/fetchTripMemberDetails" , fetchTripMemberDetailsValidation , fetchTripMemberDetails);
router.post("/createUserInvite" , createUserInviteValidation , createUserInvite);
router.post("/fetchFinalItinerary" , fetchFinalItineraryValidation , fetchFinalItinerary);
router.post("/fetchTripAnalytics" , fetchTripAnalytics);
router.post("/fetchTripExpenses" , fetchTripExpenses);

export default router;