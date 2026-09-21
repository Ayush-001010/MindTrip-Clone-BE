import { Request , Response } from "express";
import { validationResult } from "express-validator";
import Trip from "../Service/Trip/Trip";
import SplitWiseFacade from "../Service/SplitWise/SplitWiseFacade";

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

        const userID = req.auth?.userId;

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
    
