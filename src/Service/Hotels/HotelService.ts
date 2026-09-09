import axios from "axios";
import IHotel from "../../Interface/DataInterface/IHotel";
import { HotelSearchResponse } from "../../Interface/DataInterface/HotelSearchResponse";
class HotelService {
  async getHotels(
    city: string,
    checkInDate: string,
    checkOutDate: string,
    adults: number = 2,
  ): Promise<IHotel[]> {
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
      throw new Error("SERPAPI_API_KEY is not defined");
    }
    
    const response = await axios.get(`https://serpapi.com/search`, {
      params: {
        engine: "google_hotels",
        q: `hotels in ${city}`,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        adults: adults.toString(),
        currency: "INR",
        gl: "in",
        hl: "en",
        api_key: apiKey,
      },
    });

    const data = response.data as HotelSearchResponse;

    return (data.properties ?? [])
      .filter(
        (hotel) =>
          hotel.gps_coordinates?.latitude !== undefined &&
          hotel.gps_coordinates?.longitude !== undefined,
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

        extractedPrice: hotel.rate_per_night?.extracted_lowest,

        image: hotel.images?.[0]?.thumbnail,

        amenities: hotel.amenities,

        link: hotel.link,
      }));
  }
}

export default HotelService;
