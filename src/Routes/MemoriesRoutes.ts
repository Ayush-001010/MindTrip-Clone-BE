import { Router } from "express";
import { createNewMemory, fetchMemory, inviteUser, fetchParticularMemoryDetails, fetchParticularMemoryDetailsForInvite, userAddedToMemory } from "../Controller/Memories";

const router = Router();

router.post("/create", createNewMemory);
router.get("/fetch", fetchMemory);
router.post("/invite", inviteUser);
router.get("/details", fetchParticularMemoryDetails);
router.get("/details/invite", fetchParticularMemoryDetailsForInvite);
router.post("/addToMemory", userAddedToMemory);

export default router;