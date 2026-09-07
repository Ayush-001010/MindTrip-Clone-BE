import { Router } from "express";
import { getPlaces } from "../controllers/placeController";

const router = Router();

router.get("/places", getPlaces);

export default router;