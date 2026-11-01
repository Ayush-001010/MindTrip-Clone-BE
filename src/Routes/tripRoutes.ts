import { Router } from "express";
import {createNewTripValidation,fetchTripMemberDetailsValidation,createUserInviteValidation,fetchFinalItineraryValidation,joinTripValidation,validateUserInviteValidation} from "../Validation/TripValidation";
import { createNewTrip,fetchTripMemberDetails,createUserInvite,fetchFinalItinerary,fetchTripAnalytics,fetchTripExpenses,joinTrip,validateUserInvite,fetchTripIDs,chatWithAI,getImportantDates, fetchTripHotelDetails , isUserTripAdmin, fetchOldMessages, likeOrDislikePollOption, addCommentOnOpinion, checkInUpdate } from "../Controller/Trip";

const router = Router();

router.post("/createNewTrip",createNewTripValidation,createNewTrip);
router.post("/fetchTripMemberDetails",fetchTripMemberDetailsValidation,fetchTripMemberDetails);
router.post("/createUserInvite",createUserInviteValidation,createUserInvite);
router.post("/joinTrip",joinTripValidation,joinTrip);
router.post("/validateUserInvite",validateUserInviteValidation,validateUserInvite);
router.post("/fetchFinalItinerary",fetchFinalItineraryValidation,fetchFinalItinerary);
router.post("/fetchTripAnalytics",fetchTripAnalytics);
router.post("/fetchTripExpenses",fetchTripExpenses);
router.get("/fetchTripIDs",fetchTripIDs)
router.post("/chatWithAI",chatWithAI);
router.get("/getImportantDates",getImportantDates);
router.get("/fetchTripHotelDetails",fetchTripHotelDetails);
router.get("/isUserTripAdmin",isUserTripAdmin);
router.get("/fetchOldGroupHubPost", fetchOldMessages);
router.post("/likeOrDislikePollOption", likeOrDislikePollOption);
router.post("/addCommentOnOpinion", addCommentOnOpinion);
router.post("/checkInUpdate", checkInUpdate);


export default router;