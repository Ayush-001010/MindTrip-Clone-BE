import IExplorePlace from "../../Interface/DataInterface/IExplorePlace";
import RedisStore from "../RateLimiter/RateLimiterStore/RedisStore";

interface SerpApiPlace {
  place_id?: string;
  title?: string;
  name?: string;
  description?: string;
  type?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  price?: string;
  thumbnail?: string;
  gps_coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  links?: {
    website?: string;
  };
}

interface SerpApiResponse {
  local_results?: SerpApiPlace[];
}

class PlaceService {
  private redisStore = new RedisStore();

  async getPlaces(
    city: string,
    type: "restaurants" | "things-to-do" | "activities",
    page: number,
    limit: number,
    minRating?: number,
    activityType?: string
  ) {
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
      throw new Error("SERPAPI_API_KEY is missing");
    }

    const normalizedCity = city.trim().toLowerCase();
    const cacheKey = `explore:places:${normalizedCity}:${type}`;
    const redisClient = this.redisStore.getRedisClient();
    const cachedPlaces = await redisClient.get(cacheKey);

    let places: IExplorePlace[];

    if (cachedPlaces) {
      places = JSON.parse(cachedPlaces) as IExplorePlace[];
    } else {
      const query =
        type === "restaurants"
          ? `restaurants in ${city}`
          : type === "things-to-do"
          ? `things to do in ${city}`
          : `activities in ${city}`;

      const url = new URL("https://serpapi.com/search");

      url.searchParams.set("engine", "google_maps");

      url.searchParams.set("type", "search");

      url.searchParams.set("q", query);
      url.searchParams.set("hl", "en");
      url.searchParams.set("gl", "in");
      url.searchParams.set("api_key", apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `SerpApi request failed with status ${response.status}`
        );
      }

      const data = (await response.json()) as SerpApiResponse;

      places = (data.local_results || [])
        .filter(
          (place) =>
            place.gps_coordinates?.latitude !== undefined &&
            place.gps_coordinates?.longitude !== undefined
        )
        .map((place, index) => ({
          id: place.place_id || `${type}-${city}-${index}`,

          name: place.title || place.name || "Unknown place",

          description: place.description,

          type: place.type,

          address: place.address,

          latitude: place.gps_coordinates!.latitude!,

          longitude: place.gps_coordinates!.longitude!,

          rating: place.rating,

          reviews: place.reviews,

          price: place.price,

          image: place.thumbnail,

          link: place.links?.website,
        }));
      await redisClient.set(cacheKey, JSON.stringify(places), "EX", 3600);
    }
   
    let filteredPlaces = places;

    if (minRating !== undefined) {
      filteredPlaces = filteredPlaces.filter(
        (place) => place.rating !== undefined && place.rating >= minRating
      );
    }

    if (type === "activities" && activityType && activityType !== "all") {
      filteredPlaces = filteredPlaces.filter(
        (place) => this.getActivityCategory(place) === activityType
      );
    }
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlaces = filteredPlaces.slice(startIndex, endIndex);

    const hasMore = endIndex < filteredPlaces.length;
    return {
      data: paginatedPlaces,
      pagination: {
        page,
        limit,
        total: filteredPlaces.length,
        hasMore,
      },
    };
  }
  private getActivityCategory(place: IExplorePlace): string {
    const text = `${place.type || ""} ${place.name || ""} ${
      place.description || ""
    }`.toLowerCase();

    if (
      text.includes("amusement") ||
      text.includes("theme park") ||
      text.includes("water park")
    ) {
      return "amusement";
    }

    if (
      text.includes("indoor") ||
      text.includes("bowling") ||
      text.includes("escape room") ||
      text.includes("gaming") ||
      text.includes("play zone")
    ) {
      return "indoor";
    }

    if (
      text.includes("trek") ||
      text.includes("camping") ||
      text.includes("cycling") ||
      text.includes("hiking") ||
      text.includes("park") ||
      text.includes("outdoor")
    ) {
      return "outdoor";
    }

    if (
      text.includes("adventure") ||
      text.includes("rock climbing") ||
      text.includes("zipline") ||
      text.includes("rafting") ||
      text.includes("paragliding")
    ) {
      return "adventure";
    }

    if (
      text.includes("tour") ||
      text.includes("experience") ||
      text.includes("workshop") ||
      text.includes("guided") ||
      text.includes("food walk")
    ) {
      return "tours";
    }

    return "other";
  }
}

export default new PlaceService();
