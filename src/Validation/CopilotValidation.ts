import { body } from "express-validator";

export const tripItineraryValidation = [
    body("userMessage").isString().withMessage("userMessage must be a string").notEmpty().withMessage("userMessage is required"),
    body("tripID").isString().withMessage("tripID must be a string").notEmpty().withMessage("tripID is required")
];

export const fetchTripChatValidation = [
    body("tripID").isString().withMessage("tripID must be a string").notEmpty().withMessage("tripID is required"),
    body("userID").isString().withMessage("userID must be a string").notEmpty().withMessage("userID is required")
];