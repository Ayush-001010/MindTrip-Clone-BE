import { Router } from "express";
import { activitesValidation, getPlaceImageValidation, someRandomImagesValidation } from "../Validation/CommonValidation";
import { activites } from "../Controller/Common";
import { someRandomImages, getPlaceImage, getMetaDataForBlog } from "../Controller/Common";
const route = Router();

route.get("/activites" , activitesValidation , activites);
route.get("/someRandomImages", someRandomImagesValidation, someRandomImages);
route.get("/getPlaceImage",getPlaceImageValidation,getPlaceImage);
route.get("/getMetaDataForBlog", getMetaDataForBlog);

export default route;