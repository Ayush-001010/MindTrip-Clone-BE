import { query } from "express-validator";

const activitesValidation = [
    query("activityName").isString().withMessage("activityName must be a string").notEmpty().withMessage("activityName is required")
];

export { activitesValidation };