import DestinationAgentStrategy from "./DestinationAgent/DestinationAgentStrategy";
import ItineraryAgentStrategy from "./ItineraryAgent/ItineraryAgentStrategy";
import HotelAgentStrategy from "./HotelAgent/HotelAgentStrategy";
import FavouriteAgentStrategy from "./FavouriteAgent/FavouriteAgent"; 
import CartoonAgentStrategy from "./CartoonAgent/CartoonAgent";
import IAgentStrategy from "../../../Interface/ClassInterface/IAgentStrategy";

export default class AgentFactory {
    public static async createAgent(agentType:"destination" | "itinerary" | "hotel" | "favourite" | "cartoon-agent" | null , tripID?: string , userID?: number): Promise<IAgentStrategy | null | undefined> {
        switch(agentType) {
            case "destination":
                return new DestinationAgentStrategy();
            case "itinerary":
                return new ItineraryAgentStrategy(tripID || "");
            case "hotel":
                return await HotelAgentStrategy.getInstance(tripID || "");
            case "favourite":
                return new FavouriteAgentStrategy(userID || 1);
            case "cartoon-agent":
                return new CartoonAgentStrategy();
        }
    }
}