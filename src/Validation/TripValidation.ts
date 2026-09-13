import { body } from "express-validator";

export const createNewTripValidation = [
    body("userID").notEmpty().withMessage("userID is required")
];

export const fetchTripDetailsValidation = [
    body("tripID").notEmpty().withMessage("tripID is required")
];