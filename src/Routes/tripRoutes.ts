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

export default router;