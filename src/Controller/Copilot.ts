import { Request, Response } from "express";
import { validationResult } from "express-validator";
import CopilotManager from "../Manager/CopilotManager";
import APIResponseInterface from "../Interface/ResponseInterface/APIResponseInterface";

export const tripItineraryHandler = async (userMessage : string, tripID : string) : Promise<APIResponseInterface<any> | undefined> => {
  try{
    const copilotInstance = new CopilotManager();
    const response = await copilotInstance.tripItinerary(userMessage , tripID);
    return response;
  } catch(error){
    console.log("Error  ", error);
    return {success : false}
  }
};

export const fetchTripChat = async (tripID : string, userID : string) => {
  try{
    const copilotInstance = new CopilotManager();
    const response = await copilotInstance.fetchTripChat(tripID , userID);
    return response;
  } catch(error){
    console.log("Error  ", error);
    return {success : false}
  }
};