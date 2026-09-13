import { Router } from "express";
import { activitesValidation, someRandomImagesValidation } from "../Validation/CommonValidation";
import { activites } from "../Controller/Common";
import { someRandomImages } from "../Controller/Common";
const route = Router();

route.get("/activites" , activitesValidation , activites);
route.get("/someRandomImages", someRandomImagesValidation, someRandomImages);

export default route;