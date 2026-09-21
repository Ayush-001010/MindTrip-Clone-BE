import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const getJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwtSecret;
};

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const jwtSecret = getJwtSecret();
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication token is required",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authentication token is required",
            });
        }

        const decoded = jwt.verify(token, jwtSecret);

        if (typeof decoded === "string") {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        req.auth = {
            userId: decoded.userId as number,
        };

        next();

    } catch (error) {
        if (error instanceof Error && error.message === "JWT_SECRET is not defined") {
            return res.status(500).json({
                message: "Server configuration error",
            });
        }

        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};