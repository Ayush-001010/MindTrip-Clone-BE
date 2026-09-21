import { Router } from "express";
import passport from "passport";

import {
  getCurrentUser,
  loginUser,
  registerUser,
  googleCallback,
} from "../Controller/AuthController";

import { authenticateToken } from "../Middleware/authMiddleware";
import rateLimiterMiddleware from "../Middleware/RateLimitter";

const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleCallback,
);

router.get(
  "/protected",
  authenticateToken,
  rateLimiterMiddleware,
  (_req, res) => {
    res.status(200).json({
      message: "You have access to this protected route",
    });
  },
);

router.get("/me", authenticateToken, rateLimiterMiddleware, getCurrentUser);

export default router;
