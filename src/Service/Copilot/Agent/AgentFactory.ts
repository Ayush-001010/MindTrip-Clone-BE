import DestinationAgentStrategy from "./DestinationAgent/DestinationAgentStrategy";
import ItineraryAgentStrategy from "./ItineraryAgent/ItineraryAgentStrategy";
import HotelAgentStrategy from "./HotelAgent/HotelAgentStrategy";
import FavouriteAgentStrategy from "./FavouriteAgent/FavouriteAgent"; 

export default class AgentFactory {
    public static async createAgent(agentType:"destination" | "itinerary" | "hotel" | "favourite" | null , tripID?: string , userID?: number) {
        switch(agentType) {
            case "destination":
                return new DestinationAgentStrategy();
            case "itinerary":
                return new ItineraryAgentStrategy(tripID || "");
            case "hotel":
                return await HotelAgentStrategy.getInstance(tripID || "");
            case "favourite":
                return new FavouriteAgentStrategy(userID || 1);
        }
    }
}