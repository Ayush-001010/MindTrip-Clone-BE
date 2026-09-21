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
    body("inviteURLID")
        .notEmpty()
        .withMessage("inviteURLID is required")
];
export const joinTripValidation = [
    body("tripID")
        .notEmpty()
        .withMessage("tripID is required")
];