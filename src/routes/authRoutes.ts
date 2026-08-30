import { Router } from "express";
import passport from "passport";

import {
    getCurrentUser,
    loginUser,
    registerUser,
    googleCallback,
} from "../controllers/authController";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/login",
    }),
    googleCallback
);

router.get(
    "/protected",
    authenticateToken,
    (_req, res) => {
        res.status(200).json({
            message: "You have access to this protected route",
        });
    }
);

router.get(
    "/me",
    authenticateToken,
    getCurrentUser
);

export default router;