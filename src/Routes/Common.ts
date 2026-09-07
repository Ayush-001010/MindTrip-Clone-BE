import { Router } from "express";
import { activitesValidation } from "../Validation/CommonValidation";
import { activites } from "../Controller/Common";
const route = Router();

route.get("/activites" , activitesValidation , activites);

export default route;