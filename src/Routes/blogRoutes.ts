import { Router } from "express";
import { createNewBlog, fetchTopFiveBlogs, fetchProfileAndTitle, fetchMetaData, fetchBlog, fetchBlogByID, fetchBlogActivityName } from "../Controller/BlogController";

const router = Router();

router.post("/create", createNewBlog);
router.get("/fetch", fetchBlog);
router.get("/fetch/:id", fetchBlogByID);
router.get("/top-five", fetchTopFiveBlogs);
router.get("/profile-and-title", fetchProfileAndTitle);
router.get("/fetchMetaData", fetchMetaData);
router.get("/activity-name", fetchBlogActivityName);



export default router;