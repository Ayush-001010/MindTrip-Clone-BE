import { Request, Response } from "express";
import BlogGlobeFeedService from "../Service/BlogGlobeFeedService/BlogGlobeFeedService";

export const fetchBlogUniquePlaces = async (req : Request , res : Response) => {
    try {
        const blogGlobeFeedService = new BlogGlobeFeedService();
        const uniquePlaces = await blogGlobeFeedService.fetchBlogUniquePlaces();
        res.send({ success: true, data: uniquePlaces });
    } catch (error) {
        console.log("Error fetching blog unique places: ", error);
        res.send({ success: false, data: [] });
    }
}