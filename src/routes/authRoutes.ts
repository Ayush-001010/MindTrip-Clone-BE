import { Router } from "express";
import { getCurrentUser, loginUser, registerUser } from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
const router = Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/protected", authenticateToken, (_req, res) => {
    res.status(200).json({
        message: "You have access to this protected route",
    });
});
router.get(
    "/me",
    authenticateToken,
    getCurrentUser
);

export default router;