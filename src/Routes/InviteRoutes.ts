import { Router } from "express";
import { redirectUserInvite } from "../Controller/InviteController";

const router = Router();

router.get("/i/:base62", redirectUserInvite);

export default router;