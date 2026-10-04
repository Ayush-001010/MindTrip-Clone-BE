import { Router } from "express";
import passport from "passport";
import { createNewBlog, fetchTopFiveBlogs, fetchProfileAndTitle, fetchMetaData, fetchBlog, fetchBlogByID } from "../Controller/BlogController";

const router = Router();

router.post("/create", createNewBlog);
router.get("/fetch", fetchBlog);
router.get("/fetch/:id", fetchBlogByID);
router.get("/top-five", fetchTopFiveBlogs);
router.get("/profile-and-title", fetchProfileAndTitle);
router.get("/fetchMetaData", fetchMetaData);



export default router;