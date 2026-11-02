import { Request, Response } from "express";
import FaviouritesService from "../Service/FaviouritesService/FaviouritesService";
import UserService from "../Service/User/UserService";
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

export const getCollectionDetails = async (req: Request, res: Response) => {
    const {collectionId , type } = req.body;
    if(!collectionId || !type) {
        return res.status(400).json({ success: false, message: "Collection ID and type are required" });
    }
    const faviouritesService = new FaviouritesService();
    const detailsResponse = await faviouritesService.getCollectionDetails(Number(collectionId), type as "Activity" | "Hotel" | "Blog");
    return res.send(detailsResponse);
  
}
export const removeFavourite = async (req: Request, res: Response) => {
    try {
        const { collectionId, favouriteId, type, userEmail } = req.body;

        if (!collectionId || !favouriteId || !type || !userEmail) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        if (!["Activity", "Hotel"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid favourite type"
            });
        }

        const favouritesService = new FaviouritesService();

        const response = await favouritesService.removeFavourite(
            Number(collectionId),
            Number(favouriteId),
            type as "Activity" | "Hotel",
            userEmail
        );

        return res.send(response);

    } catch (error) {
        console.error("Error removing favourite:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove favourite"
        });
    }
};
