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