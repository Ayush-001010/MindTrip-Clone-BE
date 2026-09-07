import IExplorePlace from "../../Interface/DataInterface/IExplorePlace";


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
  async getPlaces(
    city: string,
    type: "restaurants" | "things-to-do"
  ): Promise<IExplorePlace[]> {
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
      throw new Error("SERPAPI_API_KEY is missing");
    }

    const query =
      type === "restaurants"
        ? `restaurants in ${city}`
        : `things to do in ${city}`;

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

    const data =
      (await response.json()) as SerpApiResponse;

    return (data.local_results || [])
      .filter(
        (place) =>
          place.gps_coordinates?.latitude !== undefined &&
          place.gps_coordinates?.longitude !== undefined
      )
      .map((place, index) => ({
        id:
          place.place_id ||
          `${type}-${city}-${index}`,

        name:
          place.title ||
          place.name ||
          "Unknown place",

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
  }
}

export default new PlaceService();