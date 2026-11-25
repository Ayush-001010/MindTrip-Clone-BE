import { Router } from "express";
import { getCollections, createCollection, addFavourites, getCollectionDetails, removeFavourite, renameCollection, deleteCollection } from "../Controller/FaviouritesController";

const route = Router();

route.get("/collections", getCollections);
route.post("/createCollections", createCollection);
route.post("/addFavourites", addFavourites);
route.post("/collectionDetails", getCollectionDetails);
route.post("/removeFavourite", removeFavourite);
route.post("/renameCollection", renameCollection);
route.post("/deleteCollection", deleteCollection);
export default route;