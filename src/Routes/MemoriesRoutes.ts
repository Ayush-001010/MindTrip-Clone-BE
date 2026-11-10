import { Router } from "express";
import { createNewMemory, fetchMemory } from "../Controller/Memories";

const router = Router();

router.post("/create", createNewMemory);
router.get("/fetch", fetchMemory);

export default router;