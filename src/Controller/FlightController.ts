
import { Request, Response } from "express";
import FlightService from "../Service/Flight/FlightService";


class FlightController {
  private flightService = new FlightService();

  searchAirport = async (req: Request, res: Response) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Airport search query is required",
        });
      }

      const airports = await this.flightService.searchAirport(query);

      return res.status(200).json({
        success: true,
        data: airports,
      });
    } catch (error) {
      console.error("Error searching airports:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to search airports",
      });
    }
  };

  searchFlights = async (req: Request, res: Response) => {
    try {
      const {
        originSkyId,
        destinationSkyId,
        originEntityId,
        destinationEntityId,
        date,
        returnDate,
        adults,
        childrens,
        infants,
        cabinClass,
        currency,
        countryCode,
        market,
        locale,
        sortBy,
        limit,
      } = req.query;
  
      if (
        !originSkyId ||
        !destinationSkyId ||
        !originEntityId ||
        !destinationEntityId ||
        !date
      ) {
        return res.status(400).json({
          success: false,
          message: "Origin, destination and departure date are required",
        });
      }
  
      const flights = await this.flightService.searchFlights({
        originSkyId: String(originSkyId),
        destinationSkyId: String(destinationSkyId),
        originEntityId: String(originEntityId),
        destinationEntityId: String(destinationEntityId),
        date: String(date),
        returnDate: returnDate ? String(returnDate) : undefined,
        adults: adults ? Number(adults) : 1,
        childrens: childrens ? Number(childrens) : 0,
        infants: infants ? Number(infants) : 0,
        cabinClass: cabinClass as
          | "economy"
          | "premium_economy"
          | "business"
          | "first"
          | undefined,
        currency: currency ? String(currency) : "INR",
        countryCode: countryCode ? String(countryCode) : "IN",
        market: market ? String(market) : "en-IN",
        locale: locale ? String(locale) : "en-US",
        sortBy: sortBy ? String(sortBy) : "best",
        limit: limit ? Number(limit) : 20,
      });
  
      return res.status(200).json({
        success: true,
        data: flights,
      });
    } catch (error) {
      console.error("Error searching flights:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to search flights",
      });
    }
  };
}

export default FlightController;
