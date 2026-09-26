export default interface IBlogData {
    tripTitle: string;
    tripOverview: string;
    totalSpent: number;
    tripDuration: number;
    noOfPlaces: number;
    noOfActivities: number;
    activities: IBlogActivite[];
    hotel: IBlogHotel[]; 
    bookingURL: string;
    travel: IBlogTravel[];
}

export interface IBlogActivite {
    type:"activity";
    day: number;
    placeName: string;
    activityType:"trek" | "surfing" | "sightseeing" | "sketting" | "attraction" | "boating" | "temple";
    time: string;
    description: string; 
    tips: string[];
    coordinates: {
        latitude: number;
        longitude: number;
    };
    images: string[];
    sideActivities: IBlogActivite[];
    amountSpent: number;
}

export interface IBlogTravel{
    type:"travel";
    time: string;
    activityNumber: number;
    day: number;
    travelType: "flight" | "train" | "bus" | "car" | "boat" | "rapido" | "bicycle" | "uber" | "ola";
    amountSpent: number;
    description: string;
}

export interface IBlogHotel {
    name: string;
    address: string;
    checkInDate: string;
    checkOutDate: string;
    amountSpent: number;
    description: string;
    images: string;
}