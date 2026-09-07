import { Request, Response } from "express";
import { validationResult } from "express-validator";
import CopilotManager from "../Manager/CopilotManager";

export const TripItinerary = async (req:Request , res:Response) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userMessage , tripID } = req.body;
    const copilotInstance = new CopilotManager();
    const response = await copilotInstance.tripItinerary(userMessage , tripID);
    return res.send(response);
  } catch(error){
    console.log("Error  ", error);
    return res.send({success : false})
  }
};

export const fetchTripChat = async (req:Request , res:Response) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { tripID , userID } = req.body;
    const copilotInstance = new CopilotManager();
    const response = await copilotInstance.fetchTripChat(tripID , userID);
    return res.send(response);
  } catch(error){
    console.log("Error  ", error);
    return res.send({success : false})
  }
};