import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types/auth";
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
        };

        res.status(201).json({
            message: "User registered successfully",
            user:userResponse,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user.id);
        res.status(200).json({
            message: "Login successful",
            token,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

export const getCurrentUser = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "User not authenticated",
            });
        }

        const user = await User.findByPk(userId, {
            attributes: {
                exclude: ["password"],
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            user,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};