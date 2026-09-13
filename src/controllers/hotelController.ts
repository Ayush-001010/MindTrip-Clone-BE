import { Request, Response } from "express";
import HotelService from "../Service/Hotels/HotelService";

const hotelService = new HotelService();

export const getHotels = async (
    req: Request,
    res: Response
) => {
    try {
        const city = req.query.city as string;

        if (!city || !city.trim()) {
            return res.status(400).json({
                success: false,
                message: "City is required",
            });
        }

        const today = new Date();

        const defaultCheckIn = today
            .toISOString()
            .split("T")[0];

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const defaultCheckOut = tomorrow
            .toISOString()
            .split("T")[0];

        const checkInDate =
            (req.query.checkInDate as string) ||
            defaultCheckIn;

        const checkOutDate =
            (req.query.checkOutDate as string) ||
            defaultCheckOut;

        const adults =
            Number(req.query.adults) || 2;

        const hotels = await hotelService.getHotels(
            city,
            checkInDate,
            checkOutDate,
            adults
        );

        return res.status(200).json({
            success: true,
            data: hotels,
        });

    } catch (error) {
        console.error("Hotel controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch hotels",
        });
    }
};