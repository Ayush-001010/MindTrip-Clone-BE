export default interface ITripHotelData {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    rating: number;
    reviews: number;
    price: number;
    image: string;
    amenities: string;
    base62: string;
    toDate?: Date;
    fromDate?: Date;
}