import IHotel from "../../Interface/DataInterface/IHotel";
import RedisStore from "../RateLimiter/RateLimiterStore/RedisStore";
interface SerpApiHotel {
    property_token?: string;
    name: string;
    description?: string;

    gps_coordinates?: {
        latitude: number;
        longitude: number;
    };

    overall_rating?: number;
    reviews?: number;

    rate_per_night?: {
        lowest?: string;
        extracted_lowest?: number;
    };

    thumbnail?: string;

    images?: {
        thumbnail?: string;
        original_image?: string;
    }[];

    amenities?: string[];

    link?: string;
}

interface SerpApiResponse {
    properties?: SerpApiHotel[];
}

class HotelService {
    private redisStore = new RedisStore();
    
    async getHotels(
        city: string,
        page: number = 1,
        limit: number = 4
    ) {
        const apiKey = process.env.SERPAPI_API_KEY;
    
        if (!apiKey) {
            throw new Error("SERPAPI_API_KEY is not defined");
        }
    
        const normalizedCity = city.trim().toLowerCase();
        const today = new Date();
        const checkInDate =
            today.toISOString().split("T")[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const checkOutDate =
            tomorrow.toISOString().split("T")[0];
        const cacheKey =
            `explore:hotels:${normalizedCity}:${checkInDate}:${checkOutDate}`;
        const redisClient =
            this.redisStore.getRedisClient();
        let hotels: IHotel[];
        const cachedHotels =
            await redisClient.get(cacheKey);
    
        if (cachedHotels) {
            hotels = JSON.parse(
                cachedHotels
            ) as IHotel[];
        } else {
            const params = new URLSearchParams({
                engine: "google_hotels",
                q: `hotels in ${city}`,
                check_in_date: checkInDate,
                check_out_date: checkOutDate,
                currency: "INR",
                gl: "in",
                hl: "en",
                api_key: apiKey,
            });
            const response = await fetch(
                `https://serpapi.com/search?${params.toString()}`
            );
            if (!response.ok) {
                throw new Error(
                    `SerpApi request failed with status ${response.status}`
                );
            }
            const data =
                (await response.json()) as SerpApiResponse;
    
            hotels = (data.properties ?? [])
                .filter(
                    (hotel) =>
                        hotel.gps_coordinates?.latitude !== undefined &&
                        hotel.gps_coordinates?.longitude !== undefined
                )
                .map((hotel, index) => ({
                    id:
                        hotel.property_token ??
                        `hotel-${index}`,
    
                    name: hotel.name,
    
                    description:
                        hotel.description,
    
                    latitude:
                        hotel.gps_coordinates!.latitude,
    
                    longitude:
                        hotel.gps_coordinates!.longitude,
    
                    rating:
                        hotel.overall_rating,
    
                    reviews:
                        hotel.reviews,
    
                    price:
                        hotel.rate_per_night?.lowest,
    
                    extractedPrice:
                        hotel.rate_per_night
                            ?.extracted_lowest,
    
                    image:
                        hotel.thumbnail ??
                        hotel.images?.[0]?.thumbnail,
    
                    amenities:
                        hotel.amenities,
    
                    link:
                        hotel.link,
                }));
            await redisClient.set(
                cacheKey,
                JSON.stringify(hotels),
                "EX",
                3600
            );
        }
        const startIndex =
            (page - 1) * limit;
    
        const endIndex =
            startIndex + limit;
    
        const paginatedHotels =
            hotels.slice(
                startIndex,
                endIndex
            );
    
        const hasMore =
            endIndex < hotels.length;
    
        return {
            data: paginatedHotels,
            pagination: {
                page,
                limit,
                total: hotels.length,
                hasMore,
            },
        };
    }
}

export default HotelService;