import { Request, Response } from "express";
import { validationResult } from "express-validator";
import CommonService from "../Service/Common/CommonService";
import CloudFactory from "../Service/Cloud/CloudFactory";

export const activites = async (req: Request, res: Response) => {
    try {
        const commonServiceInstance = CommonService.getInstance();
        const activityName = req.query.activityName as string;

        if (!activityName) {
            return res.status(400).json({ error: "activityName query parameter is required" });
        }

        const result = await commonServiceInstance.activites(activityName);

        if (result.success) {
            return res.send(result);
        } else {
            return res.status(404).json({ error: "Activity not found" });
        }
    } catch (error) {
        console.log("Error  ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const someRandomImages = async (req: Request, res: Response) => {
    try {
        const {type} = req.query;
        switch(type) {
            case "emptyChatBox":{
                const cloudServiceInstance = CloudFactory.getCloudServiceInstance();
                return res.send({
                    success : true,
                    data : cloudServiceInstance.getImages("Common/—Pngtree—cool travelling van tropical_8164641.png").data  
                })
            }
        }
    }
    catch(error) {
        console.log("Error  ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getPlaceImage = async (req:Request , res : Response) => {
    try{
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({ error: error.array() });
        }
        const placeName = req.query.placeName as string;
        if (!placeName) {
            return res.status(400).json({ error: "placeName query parameter is required" });
        }
        const commonServiceInstance = CommonService.getInstance();
        const imageURL = await commonServiceInstance.getPlaceImage(placeName);
        if (imageURL) {
            return res.send({ success: true, data: imageURL });
        } else {
            return res.status(404).json({ error: "Place image not found" });
        }
    } catch(error) {
        console.log("Error  ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};