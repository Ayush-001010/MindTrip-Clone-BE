import { Request, Response } from "express";
import FaviouritesService from "../Service/FaviouritesService/FaviouritesService";

export const getCollections = async (req: Request, res: Response) => {
    const {userEmail} = req.query;
    if(!userEmail) {
        return res.status(400).json({ success: false, message: "User email is required" });
    }
    const faviouritesService = new FaviouritesService();
    const collectionsResponse = await faviouritesService.getCollections(userEmail as string);
    return res.send(collectionsResponse);
}

export const createCollection = async (req: Request, res: Response) => {
    const { name, userEmail } = req.body;
    if(!name || !userEmail) {
        return res.status(400).json({ success: false, message: "Name and user email are required" });
    }
    const faviouritesService = new FaviouritesService();
    const createResponse = await faviouritesService.createCollection(name, userEmail);
    return res.send(createResponse);
}

export const addFavourites = async (req: Request, res: Response) => {
    const {collectionId , data , type } = req.body;
    if(!collectionId || !data || !type) {
        return res.status(400).json({ success: false, message: "Collection ID, data, and type are required" });
    }
    const faviouritesService = new FaviouritesService();
    const addResponse = await faviouritesService.addFavourites(collectionId, type, data);
    return res.send(addResponse);
}