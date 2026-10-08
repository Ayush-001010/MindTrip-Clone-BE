import { Router } from "express";
import { getCollections, createCollection, addFavourites } from "../Controller/FaviouritesController";

const route = Router();

route.get("/collections", getCollections);
route.post("/createCollections", createCollection);
route.post("/addFavourites", addFavourites);


export default route;