import { Request, Response } from "express";
import BlogService from "../Service/BlogService/BlogService";
import FuzzySearch from 'fuzzy-search';

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

export const fetchTopFiveBlogs = async (req: Request, res: Response) => {
    try{
        const blogService = new BlogService();
        const response = await blogService.fetchTopFiveBlogs();
        res.send(response);
    } catch (error) {
        console.error("Error fetching top five blogs: ", error);
        res.send({ success: false, data: [] });
    }
};

export const fetchBlog = async (req: Request, res: Response) => {
    try{
        const { page, placeName, budget, noOfPlaces, profileOrTitle, metaData } = req.query;
        const toStr = (value: unknown) => typeof value === "string" ? value : undefined;
        const toNum = (value: unknown) => {
            const num = Number(value);
            return Number.isFinite(num) && num > 0 ? num : undefined;
        };
        const metaDataList = (Array.isArray(metaData) ? metaData : [metaData])
            .filter((item): item is string => typeof item === "string")
            .flatMap(item => item.split(","));

        const blogService = new BlogService();
        const response = await blogService.fetchBlog({
            page: toNum(page) || 1,
            placeName: toStr(placeName),
            budget: toNum(budget),
            noOfPlaces: toNum(noOfPlaces),
            profileOrTitle: toStr(profileOrTitle),
            metaData: metaDataList,
        });
        res.send(response);
    } catch (error) {
        console.error("Error fetching blogs: ", error);
        res.send({ success: false, data: { blogs: [], page: 1, limit: 10, totalCount: 0, totalPages: 0 } });
    }
};

export const fetchBlogByID = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const blogId = Number(id);
        if (!Number.isFinite(blogId) || blogId <= 0) {
            res.send({ success: false, data: null, error: "Invalid blog id" });
            return;
        }

        const blogService = new BlogService();
        const response = await blogService.fetchBlogByID(blogId);
        res.send(response);
    } catch (error) {
        console.error("Error fetching blog by id: ", error);
        res.send({ success: false, data: null });
    }
};

export const fetchProfileAndTitle = async (req: Request, res: Response) => {
    try{
        const { key } = req.query;
        const blogService = new BlogService();
        const optionData = await blogService.fetchProfileAndTitle();
        const fuzzy = new FuzzySearch(optionData, ['profile', 'title']);
        console.log("Fuzzy search initialized with optionData: ", optionData);
        res.send({success : true , data: fuzzy.search(key as string || '')});
    } catch (error) {
        console.error("Error fetching profile and title: ", error);
        res.send({success : false , data: []});
    }
};

export const fetchMetaData = async (req: Request, res: Response) => {
    try{
        const { key } = req.query;
        const blogService = new BlogService();
        const { data } = await blogService.getMetaDataForBlog();
        const fuzzy = new FuzzySearch(data?.map(item => ({ value: item })) || [], ['value']);
        console.log("Fuzzy search initialized with meta data: ", data);
        res.send({success : true , data: fuzzy.search(key as string || '')});
    } catch (error) {
        console.error("Error fetching meta data: ", error);
        res.send({success : false , data: []});
    }
};