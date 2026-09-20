import { Router } from "express";
import { getHotels } from "../Controller/HotelController";

const router = Router();

router.get("/hotels", getHotels);

export default router;