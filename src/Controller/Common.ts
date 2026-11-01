import { Request, Response } from "express";
import { validationResult } from "express-validator";
import CommonService from "../Service/Common/CommonService";
import CloudFactory from "../Service/Cloud/CloudFactory";
import BlogService from "../Service/BlogService/BlogService";

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
            default: {
                const cloudServiceInstance = CloudFactory.getCloudServiceInstance();
                return res.send({
                    success : true,
                    data : cloudServiceInstance.getImages(type as string).data  
                });
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

export const getMetaDataForBlog = async (req: Request, res: Response) => {
    try {
        const blogServiceInstance = new BlogService();
        const result = await blogServiceInstance.getMetaDataForBlog();
        if (result.success) {
            return res.send(result);
        } else {
            return res.send({ success: false, data: [] });
        }
    } catch(error) {
        console.log("Error  ", error);
        res.send({ success: false, data: [] });
    }
};

export const getUploadedFileURL = async (req: Request, res: Response) => {
    try {
        const {contentType, key} = req.body;
        const cloudInstance = CloudFactory.getCloudServiceInstance();
        const url = await cloudInstance.getUploadedFileURL(contentType, key);
        if (url) {
            return res.send({success: true, data: url});
        } else {
            return res.send({success: false, data: ""});
        }
    } catch(error) {
        console.log("Error  ", error);
        res.send({success: false, data: ""});
    }
};

export const fetchUserFollowing = async (req: Request, res: Response) => {
    try {
        const userID = parseInt(req.query.userID as string);
        if (isNaN(userID)) {
            return res.status(400).json({ error: "Invalid userID query parameter" });
        }
        const commonServiceInstance = CommonService.getInstance();
        const result = await commonServiceInstance.fetchUserFollowing(userID);
        return res.send(result);
    } catch(error) {
        console.log("Error fetching user following: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const fetchUserFriends = async (req: Request, res: Response) => {
    try {
        const userID = parseInt(req.query.userID as string);
        if (isNaN(userID)) {
            return res.status(400).json({ error: "Invalid userID query parameter" });
        }
        const commonServiceInstance = CommonService.getInstance();
        const result = await commonServiceInstance.fetchUserFriends(userID);
        return res.send(result);
    } catch(error) {
        console.log("Error fetching user friends: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const fetchUserDetails = async (req: Request, res: Response) => {
    const userID = parseInt(req.query.userID as string);
    if (isNaN(userID)) {
        return res.status(400).json({ error: "Invalid userID query parameter" });
    }
    try {
        const commonServiceInstance = CommonService.getInstance();
        const result = await commonServiceInstance.fetchUserDetails(userID);
        return res.send(result);
    } catch(error) {
        console.log("Error fetching user details: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const fetchUserFollowers = async (req: Request, res: Response) => {
    try {
        const userID = parseInt(req.query.userID as string);
        if (isNaN(userID)) {
            return res.status(400).json({ error: "Invalid userID query parameter" });
        }
        const commonServiceInstance = CommonService.getInstance();
        const result = await commonServiceInstance.fetchUserFollowers(userID);
        return res.send(result);
    } catch(error) {
        console.log("Error fetching user followers: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateUserDetails = async (req: Request, res: Response) => {
    const { data , userID } = req.body; 
    if (!data || !userID) {
        return res.status(400).json({ error: "Missing data or userID in request body" });
    }
    try {
        const commonServiceInstance = CommonService.getInstance();
        const result = await commonServiceInstance.updateUserDetails(userID, data);
        return res.send(result);
    } catch(error) {
        console.log("Error updating user details: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};