import { Request , Response } from "express";
import { validationResult } from "express-validator";
import Trip from "../Service/Trip/Trip";
import SplitWiseFacade from "../Service/SplitWise/SplitWiseFacade";
import CopilotManager from "../Manager/CopilotManager";

export const createNewTrip = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const {userID} = req.body;
        const tripInstance = new Trip();
        const createNewTripResponse = await tripInstance.createNewTrip(userID);
        return res.send(createNewTripResponse);
    } catch (error) {
        console.error("Error    ", error);
        return res.send({success : false});
    }
};

export const fetchTripDetails = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const {tripID} = req.body;
        const tripInstance = new Trip();
        const fetchTripDetailsResponse = await tripInstance.fetchTripDetails(tripID);
        return res.send(fetchTripDetailsResponse);
    } catch(error){
        console.log("Error fetching trip details: ", error);
        return res.send({success:false , error: "Failed to fetch trip details"});
    }
};

export const fetchTripMemberDetails = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const {tripID} = req.body;
        const tripInstance = new Trip();
        const fetchTripMemberDetailsResponse = await tripInstance.fetchTripMemberDetails(tripID);
        return res.send(fetchTripMemberDetailsResponse);
    } catch(error){
        console.log("Error fetching trip member details: ", error);
        return res.send({success:false , error: "Failed to fetch trip member details"});
    }
};

export const createUserInvite = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const {tripID, inviteUserBy} = req.body;
        const tripInstance = new Trip();
        const createUserInviteResponse = await tripInstance.createUserInvite(tripID, inviteUserBy);
        return res.send(createUserInviteResponse);
    } catch(error){
        console.log("Error creating user invite: ", error);
        return res.send({success:false , error: "Failed to create user invite"});
    }
};

export const validateUserInvite = async (req: Request, res: Response) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return res.status(400).json({
                success: false,
                errors: errors.array()
            });

        }

        const { inviteURLID } = req.body;

        const tripInstance = new Trip();
        
        const validateUserInviteResponse =
            await tripInstance.validateUserInvite(inviteURLID);
        return res.send(validateUserInviteResponse);

    } catch (error) {

        console.log("Error validating user invite: ", error);

        return res.send({
            success: false,
            error: "Failed to validate user invite"
        });

    }
};

export const fetchFinalItinerary = async (req: Request, res: Response) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const {tripID} = req.body;
        const tripInstance = new Trip();
        const fetchFinalItineraryResponse = await tripInstance.fetchFinalItinerary(tripID);
        return res.send(fetchFinalItineraryResponse);
    } catch(error){
        console.log("Error fetching final itinerary: ", error);
        return res.send({success:false , error: "Failed to fetch final itinerary"});
    }
};

export const joinTrip = async (req: Request, res: Response) => {
    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { tripID } = req.body;

        const userID = 4;

        if (!userID) {
            return res.status(401).json({
                success: false,
                error: "USER_NOT_AUTHENTICATED"
            });
        }

        const tripInstance = new Trip();

        const joinTripResponse =
            await tripInstance.joinTrip(tripID, userID);

        return res.send(joinTripResponse);

    } catch (error) {

        console.log("Error joining trip: ", error);

        return res.send({
            success: false,
            error: "Failed to join trip"
        });
    }
};

export const fetchTripAnalytics = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const {tripID, userID} = req.body;
        const splitWiseFacadeInstance = new SplitWiseFacade(tripID);
        const fetchTripAnalyticsResponse = await splitWiseFacadeInstance.analitics(userID);
        return res.send({success: fetchTripAnalyticsResponse.splitOptSuccess, data: fetchTripAnalyticsResponse.data});
    } catch(error){
        console.log("Error fetching trip analytics: ", error);
        return res.send({success:false , error: "Failed to fetch trip analytics"});
    }
};

export const fetchTripExpenses = async (req: Request, res: Response) => {
    try {
        const {tripID} = req.body;
        const splitWiseFacadeInstance = new SplitWiseFacade(tripID);
        const fetchTripExpensesResponse = await splitWiseFacadeInstance.fetchExpenses();
        return res.send({success: fetchTripExpensesResponse.splitOptSuccess, data: fetchTripExpensesResponse.data});
    } catch(error){
        console.log("Error fetching trip expenses: ", error);
        return res.send({success:false , error: "Failed to fetch trip expenses"});
    }
};
    
export const fetchTripIDs = async (req: Request, res: Response) => {
    const { userId } = req.query as { userId: string };
    const tripInstance = new Trip();
    const fetchTripIDsResponse = await tripInstance.fetchTripIDs(userId);
    return res.send(fetchTripIDsResponse);
};

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { prompt, tripID , userID } = req.body;
        const copilotClientInstance = new CopilotManager()
        const response = await copilotClientInstance.tripItinerary(prompt, tripID , userID);
        return res.send({ success: true, data: response });
    } catch (error) {
        console.log("Error chatting with AI: ", error);
        return res.send({ success: false, error: "Failed to chat with AI" });
    }
};

export const getImportantDates = async (req: Request, res: Response) => {
    const tripServiceInstance = new Trip();
    const { userID } = req.query as { userID: string };
    const importantDatesResponse = await tripServiceInstance.searchImportantDates(userID);
    return res.send(importantDatesResponse);
};

export const fetchTripHotelDetails = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { base62 } = req.query as { base62: string };
        const tripServiceInstance = new Trip();
        const fetchTripHotelDetailsResponse = await tripServiceInstance.fetchTripHotelDetails(base62);
        return res.send(fetchTripHotelDetailsResponse);
    } catch(error){
        console.log("Error fetching trip hotel details: ", error);
        return res.send({success:false , error: "Failed to fetch trip hotel details"});
    }
};

export const commentOnTripHotel = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { base62, id, comment } = req.body;
        const tripServiceInstance = new Trip();
        const commentOnTripHotelResponse = await tripServiceInstance.commentOnTripHotel(base62, id, comment);
        return res.send(commentOnTripHotelResponse);
    } catch(error){
        console.log("Error commenting on trip hotel: ", error);
        return res.send({success:false , error: "Failed to comment on trip hotel"});
    }
};

export const likeOrDislikeTripHotel = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { base62, id, action } = req.body;
        const tripServiceInstance = new Trip();
        const likeOrDislikeTripHotelResponse = await tripServiceInstance.likeOrDislikeTripHotel(base62, id, action);
        return res.send(likeOrDislikeTripHotelResponse);
    } catch(error){
        console.log("Error liking or disliking trip hotel: ", error);
        return res.send({success:false , error: "Failed to like or dislike trip hotel"});
    }
};

export const isUserTripAdmin = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { base62, userID } = req.query as { base62: string, userID: string };
        const tripServiceInstance = new Trip();
        const isUserTripAdminResponse = await tripServiceInstance.isUserTripAdmin(base62, userID);
        return res.send(isUserTripAdminResponse);
    } catch(error){
        console.log("Error checking if user is trip admin: ", error);
        return res.send({success:false , error: "Failed to check if user is trip admin"});
    }
};

export const fetchOldMessages = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { base62 } = req.query as { base62: string };
        const tripServiceInstance = new Trip();
        const fetchOldMessagesResponse = await tripServiceInstance.fetchOldMessages(base62);
        return res.send(fetchOldMessagesResponse);
    } catch(error){
        console.log("Error fetching old messages: ", error);
        return res.send({success:false , error: "Failed to fetch old messages"});
    }
};

export const likeOrDislikePollOption = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { optionID, like } = req.body;
        const tripServiceInstance = new Trip();
        const likeOrDislikePollOptionResponse = await tripServiceInstance.likeOrDislikePollOption(optionID, like);
        return res.send(likeOrDislikePollOptionResponse);
    } catch(error){
        console.log("Error liking or disliking poll option: ", error);
        return res.send({success:false , error: "Failed to like or dislike poll option"});
    }
};

export const addCommentOnOpinion = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { postId, comment, userName, parentOpinionCommentId } = req.body;
        const tripServiceInstance = new Trip();
        const addCommentOnOpinionResponse = await tripServiceInstance.addCommentOnOpinion(postId, comment, userName, parentOpinionCommentId);
        return res.send(addCommentOnOpinionResponse);
    } catch(error){
        console.log("Error adding comment on opinion: ", error);
        return res.send({success:false , error: "Failed to add comment on opinion"});
    }
};