import IHotel from "../../Interface/DataInterface/IHotel";

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

    async getHotels(
        city: string,
        checkInDate: string,
        checkOutDate: string,
        adults: number = 2
    ): Promise<IHotel[]> {

        const apiKey = process.env.SERPAPI_API_KEY;

        if (!apiKey) {
            throw new Error("SERPAPI_API_KEY is not defined");
        }

        const params = new URLSearchParams({
            engine: "google_hotels",
            q: `hotels in ${city}`,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            adults: adults.toString(),
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

        return (data.properties ?? [])
            .filter(
                (hotel) =>
                    hotel.gps_coordinates?.latitude !== undefined &&
                    hotel.gps_coordinates?.longitude !== undefined
            )
            .map((hotel, index) => ({
                id: hotel.property_token ?? `hotel-${index}`,

                name: hotel.name,

                description: hotel.description,

                latitude: hotel.gps_coordinates!.latitude,

                longitude: hotel.gps_coordinates!.longitude,

                rating: hotel.overall_rating,

                reviews: hotel.reviews,

                price: hotel.rate_per_night?.lowest,

                extractedPrice:
                    hotel.rate_per_night?.extracted_lowest,

                image:
                    hotel.thumbnail ??
                    hotel.images?.[0]?.thumbnail,

                amenities: hotel.amenities,

                link: hotel.link,
            }));
    }
}

export default HotelService;