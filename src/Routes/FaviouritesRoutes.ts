import { Router } from "express";
import { getCollections, createCollection, addFavourites, getCollectionDetails } from "../Controller/FaviouritesController";

const route = Router();

route.get("/collections", getCollections);
route.post("/createCollections", createCollection);
route.post("/addFavourites", addFavourites);
route.post("/collectionDetails", getCollectionDetails);


export default route;