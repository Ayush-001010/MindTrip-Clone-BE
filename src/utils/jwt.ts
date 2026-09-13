import jwt from "jsonwebtoken";

const getJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined in .env");
    }

    return jwtSecret;
};

export const generateToken = (userId: number) => {
    return jwt.sign(
        { userId },
        getJwtSecret(),
        { expiresIn: "1d" }
    );
};