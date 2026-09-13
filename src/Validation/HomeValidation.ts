import {query} from "express-validator";

export const exploreTripValidation = [
    query("pageNo").notEmpty().withMessage("Page number is required").isInt({ min: 1 }).withMessage("Page number must be a positive integer"),
];