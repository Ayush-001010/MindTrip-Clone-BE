import { Request , Response } from "express";
import { validationResult } from "express-validator";
import Trip from "../Service/Trip/Trip";

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