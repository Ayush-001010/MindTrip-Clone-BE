import { Router } from "express";
import { activitesValidation, getPlaceImageValidation, someRandomImagesValidation } from "../Validation/CommonValidation";
import { activites } from "../Controller/Common";
import { someRandomImages, getPlaceImage } from "../Controller/Common";
const route = Router();

route.get("/activites" , activitesValidation , activites);
route.get("/someRandomImages", someRandomImagesValidation, someRandomImages);
route.get("/getPlaceImage",getPlaceImageValidation,getPlaceImage);

export default route;