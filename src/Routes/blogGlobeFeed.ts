import { Router } from "express";
import { fetchBlogUniquePlaces } from "../Controller/BlogGlobeFeed";

const router = Router();

router.get("/unique-places", fetchBlogUniquePlaces);

export default router;