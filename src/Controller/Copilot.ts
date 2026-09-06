import { Request, Response } from "express";
import CopilotService from "../Service/Copilot/CopilotService";

export const TripItinerary = async (req:Request , res:Response) => {
  try{
    const { prompt } = req.body;
    
    const copilotInstance = new CopilotService();
    const response = await copilotInstance.coordinatorAgent(prompt);
    return res.send(response);

  } catch(error){
    console.log("Error  ", error);
    return res.send({success : false})
  }
};