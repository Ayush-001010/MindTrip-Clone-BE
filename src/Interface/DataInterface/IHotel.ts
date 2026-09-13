export default interface IHotel {
    id: string;
    name: string;
    description?: string;

    latitude: number;
    longitude: number;

    rating?: number;
    reviews?: number;

    price?: string;
    extractedPrice?: number;

    image?: string;

    amenities?: string[];

    link?: string;
}