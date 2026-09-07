import { Request, Response } from "express";
import placeService from "../Service/Places/PlaceService";



export const getPlaces = async (
  req: Request,
  res: Response
) => {
  try {
    const city = String(req.query.city || "").trim();

    const type = String(
      req.query.type || ""
    ) as "restaurants" | "things-to-do";

    if (!city) {
      return res.status(400).json({
        success: false,
        error: "city is required",
      });
    }

    if (
      type !== "restaurants" &&
      type !== "things-to-do"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "type must be restaurants or things-to-do",
      });
    }

    const places = await placeService.getPlaces(
      city,
      type
    );

    return res.status(200).json({
      success: true,
      data: places,
    });
  } catch (error) {
    console.error("Error fetching places:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch places",
    });
  }
};