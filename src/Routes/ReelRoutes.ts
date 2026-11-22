import { Router } from "express";
import { fetchReel } from "../Controller/ReelController";

const router = Router();

router.get("/fetch", fetchReel);

export default router;