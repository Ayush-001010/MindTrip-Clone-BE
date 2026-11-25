
export default interface ITripFlightData {
    id?: number;
    flightId: string;
    airline: string;
    airlineLogo: string;
    flightNumber: string;
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    departure: Date | string;
    arrival: Date | string;
    durationMinutes: number;
    stops: number;
    price: number;
    formattedPrice: string;
    segments: any[];
    isRefundable: boolean;
    emissionsKg: number;
    isBooked?: boolean;
    base62: string;
    bookedBy?: string;

    bookingGroupId?: string;
    tripType?: "One-way" | "Round-trip";

    returnLeg?: {
        airline: string;
        airlineLogo: string;
        flightNumber: string;
        origin: string;
        originCode: string;
        destination: string;
        destinationCode: string;
        departure: Date | string;
        arrival: Date | string;
        durationMinutes: number;
        stops: number;
        segments: any[];
    };
}
