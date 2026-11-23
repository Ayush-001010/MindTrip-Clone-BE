import { Router } from "express";
import { createNewBlog, fetchTopFiveBlogs, fetchProfileAndTitle, fetchMetaData, fetchBlog, fetchBlogByID, fetchBlogActivityName, fetchBlogWorkByUserId, createInProgressBlog } from "../Controller/BlogController";

const router = Router();

router.post("/create", createNewBlog);
router.get("/fetch", fetchBlog);
router.get("/fetch/:id", fetchBlogByID);
router.get("/top-five", fetchTopFiveBlogs);
router.get("/profile-and-title", fetchProfileAndTitle);
router.get("/fetchMetaData", fetchMetaData);
router.get("/activity-name", fetchBlogActivityName);
router.get("/work-by-user", fetchBlogWorkByUserId);
router.get("/in-progress", createInProgressBlog);

export default router;