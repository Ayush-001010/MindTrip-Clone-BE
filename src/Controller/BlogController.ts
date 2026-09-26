import { Request, Response } from "express";
import BlogService from "../Service/BlogService/BlogService";
import IBlogData from "../Interface/ResponseInterface/IBlogData";

export const createNewBlog = async (req : Request, res: Response) => {
    try{
        const { blogData } = req.body;

        const blogService = new BlogService();
        const response = await blogService.createNewBlog(blogData);
        res.send(response);
    } catch (error) {
        console.error("Error creating new blog: ", error);
        res.send({ success: false, data: "" });
    }
};