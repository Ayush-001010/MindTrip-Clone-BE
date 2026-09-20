import { Request, Response } from "express";
import HotelService from "../Service/Hotels/HotelService";

const hotelService = new HotelService();

export const getHotels = async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string;

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(4, Math.max(1, Number(req.query.limit) || 4));
    const minRating =
      req.query.minRating !== undefined
        ? Number(req.query.minRating)
        : undefined;
    if (
      minRating !== undefined &&
      (Number.isNaN(minRating) || minRating < 0 || minRating > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "minRating must be between 0 and 5",
      });
    }

    const result = await hotelService.getHotels(city, page, limit,minRating);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Hotel controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
    });
  }
};
