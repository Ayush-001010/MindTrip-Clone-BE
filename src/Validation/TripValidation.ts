import { body } from "express-validator";

export const createNewTripValidation = [
    body("userID").notEmpty().withMessage("userID is required")
];

export const fetchTripDetailsValidation = [
    body("tripID").notEmpty().withMessage("tripID is required")
];

export const fetchTripMemberDetailsValidation = [
    body("tripID").notEmpty().withMessage("tripID is required")
];

export const createUserInviteValidation = [
    body("tripID").notEmpty().withMessage("tripID is required"),
    body("inviteUserBy").notEmpty().withMessage("inviteUserBy is required")
];

export const fetchFinalItineraryValidation = [
    body("tripID").notEmpty().withMessage("tripID is required")
];
export const validateUserInviteValidation = [
    body("base62").notEmpty().withMessage("base62 is required")
];