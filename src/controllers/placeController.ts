import { Request, Response } from "express";
import placeService from "../Service/Places/PlaceService";

export const getPlaces = async (
  req: Request,
  res: Response
) => {
  try {
    const city = String(
      req.query.city || ""
    ).trim();

    const type = String(
      req.query.type || ""
    ) as
      | "restaurants"
      | "things-to-do"
      | "activities";

    const page = Math.max(
      1,
      Number(req.query.page) || 1
    );

    const limit = Math.min(
      4,
      Math.max(
        1,
        Number(req.query.limit) || 4
      )
    );

    if (!city) {
      return res.status(400).json({
        success: false,
        error: "city is required",
      });
    }

    if (
      type !== "restaurants" &&
      type !== "things-to-do" &&
      type !== "activities"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "type must be restaurants, things-to-do, or activities",
      });
    }

    const result =
      await placeService.getPlaces(
        city,
        type,
        page,
        limit
      );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(
      "Error fetching places:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Failed to fetch places",
    });
  }
};