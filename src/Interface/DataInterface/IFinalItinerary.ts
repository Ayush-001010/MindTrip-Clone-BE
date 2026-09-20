export interface IFinalActivity {
    time:"Morning" | "Afternoon" | "Evening" | "Whole Day";
    placeName : string;
    description: string;
    coordinates:{
        latitude: number;
        longitude: number;
    };
    crowded:{
        level: "Low" | "Medium" | "High";
        description: string;
    }
}

export interface IFinalItineraryDay {
    day: number;
    title : string;
    activities: IFinalActivity[];
}

export default interface IFinalItinerary {
    itineraryTitle: string;
    type : "final-itinerary";
    days: IFinalItineraryDay[];
}