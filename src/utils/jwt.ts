import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
}

export const generateToken = (userId: number) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: "1d" }
    );
};