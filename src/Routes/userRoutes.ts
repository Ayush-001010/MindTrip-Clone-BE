import { Router } from "express";
import { followUser, userActivity, likeBlog, dislikeBlog, userLikedBlogs } from "../Controller/UserController";
const router = Router();

router.post("/follow", followUser);
router.post("/activity", userActivity);
router.post("/like", likeBlog);
router.post("/dislike", dislikeBlog);
router.get("/liked-blogs", userLikedBlogs);


export default router;