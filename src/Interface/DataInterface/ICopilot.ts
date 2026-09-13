import IHotel from "./IHotel";

export interface RouteResult {
  route: "destination-agent" | "fallback" | "hotel-agent" | "itinerary-agent";
  reason: string;
}

export interface DestinationResult {
  description: string;
  suggestedDestination: {
    name: string;
    reason: string;
    bestTimeToVisit: string;
    famousFood: string[];
    popularAttractions: string[];
    isCrowded: boolean;
    crowded: "Low" | "Medium" | "High";
  }[];
}

export interface HotelAgentResult {
  description: string;
  hotels: IHotel[];
}