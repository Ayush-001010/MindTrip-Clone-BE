import { query } from "express-validator";

const activitesValidation = [
    query("activityName").isString().withMessage("activityName must be a string").notEmpty().withMessage("activityName is required")
];
const someRandomImagesValidation = [
    query("type").isString().withMessage("type must be a string").notEmpty().withMessage("type is required")
];

export { activitesValidation, someRandomImagesValidation };