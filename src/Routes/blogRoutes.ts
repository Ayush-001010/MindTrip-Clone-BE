import { Router } from "express";
import passport from "passport";
import { createNewBlog } from "../Controller/BlogController";

const router = Router();

router.post("/create", createNewBlog);

export default router;