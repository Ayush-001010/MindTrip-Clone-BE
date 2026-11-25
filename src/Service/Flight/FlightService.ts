import axios from "axios";
import RedisStore from "../RateLimiter/RateLimiterStore/RedisStore";
import FlightParser, {
    RawFlightResponse,
  } from "./FlightParser";
interface FlightSearchParams {
  originSkyId: string;
  destinationSkyId: string;
  originEntityId: string;
  destinationEntityId: string;
  date: string;
  returnDate?: string;
  adults?: number;
  childrens?: number;
  infants?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  currency?: string;
  countryCode?: string;
  market?: string;
  locale?: string;
  sortBy?: string;
  limit?: number;
}
interface FlightSearchResponse extends RawFlightResponse {
    status?: boolean;
  }
interface SkyScrapperAirport {
  presentation: {
    title: string;
    suggestionTitle: string;
    subtitle?: string;
  };

  navigation: {
    entityId: string;
    entityType: string;
    localizedName: string;

    relevantFlightParams: {
      skyId: string;
      entityId: string;
      flightPlaceType: string;
      localizedName: string;
    };

    relevantHotelParams?: {
      entityId: string;
      entityType: string;
      localizedName: string;
    };
  };
}

interface SkyScrapperAirportResponse {
  status: boolean;
  data: SkyScrapperAirport[];
}

class FlightService {
  private redisStore = new RedisStore();
  private flightParser = new FlightParser();
  private readonly baseURL = "https://sky-scrapper.p.rapidapi.com";

  private getHeaders() {
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
      throw new Error("RAPIDAPI_KEY is not defined");
    }

    return {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com",
    };
  }

  async searchAirport(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `flights:airport:${normalizedQuery}`;

    const redisClient = this.redisStore.getRedisClient();

    const cachedAirports = await redisClient.get(cacheKey);

    if (cachedAirports) {
      return JSON.parse(cachedAirports) as SkyScrapperAirport[];
    }

    const response = await axios.get<SkyScrapperAirportResponse>(
      `${this.baseURL}/api/v1/flights/searchAirport`,
      {
        headers: this.getHeaders(),
        params: {
          query: query.trim(),
          locale: "en-US",
        },
        timeout: 15000,
      }
    );

    const airports = response.data.data ?? [];

    await redisClient.set(cacheKey, JSON.stringify(airports), "EX", 86400);

    return airports;
  }

  async searchFlights(params: FlightSearchParams) {
    if (
      !params.originSkyId ||
      !params.destinationSkyId ||
      !params.originEntityId ||
      !params.destinationEntityId ||
      !params.date
    ) {
      throw new Error("Required flight search parameters are missing");
    }

    try {
      const response = await axios.get<FlightSearchResponse>(
        `${this.baseURL}/api/v2/flights/searchFlights`,
        {
          headers: this.getHeaders(),
          params: {
            ...params,
            adults: params.adults ?? 1,
            childrens: params.childrens ?? 0,
            infants: params.infants ?? 0,
            cabinClass: params.cabinClass ?? "economy",
            currency: params.currency ?? "INR",
            countryCode: params.countryCode ?? "IN",
            market: params.market ?? "en-IN",
            locale: params.locale ?? "en-US",
            sortBy: params.sortBy ?? "best",
            limit: params.limit ?? 20,
          },
          timeout: 30000,
        }
      );

      let result = response.data;
      
      const MAX_POLLS = 2;

      for (let i = 0; i < MAX_POLLS; i++) {
        const context =
    result.data?.context ??
    result.data?.data?.context;

        if (context?.status !== "incomplete") {
          break;
        }

        if (!context.sessionId) {
          break;
        }

        result = await this.searchIncomplete(context.sessionId);
      }
      console.log(
        "RAW FLIGHT API RESPONSE:",
        JSON.stringify(result, null, 2)
      );
       const parsedFlights = this.flightParser.parse(result);

      const cheapestFlights = parsedFlights
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 20);
      
      console.log("Total flights received:", parsedFlights.length);
      console.log("Cheapest flights displayed:", cheapestFlights.length);
      
      return cheapestFlights;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Flight API error:",
          error.response?.status,
          error.response?.data
        );
      }

      throw new Error("Failed to search flights");
    }
  }

  private async searchIncomplete(sessionId: string) {
    const response = await axios.get<FlightSearchResponse>(
      `${this.baseURL}/api/v2/flights/searchIncomplete`,
      {
        headers: this.getHeaders(),
        params: {
          sessionId,
          currency: "INR",
          market: "en-IN",
          countryCode: "IN",
          locale: "en-US",
        },
        timeout: 30000,
      }
    );

    return response.data;
  }
}

export default FlightService;
