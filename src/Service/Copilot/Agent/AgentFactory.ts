import DestinationAgentStrategy from "./DestinationAgent/DestinationAgentStrategy";
import ItineraryAgentStrategy from "./ItineraryAgent/ItineraryAgentStrategy";
import HotelAgentStrategy from "./HotelAgent/HotelAgentStrategy";

export default class AgentFactory {
    public static async createAgent(agentType:"destination" | "itinerary" | "hotel" | null , tripID?: string) {
        switch(agentType) {
            case "destination":
                return new DestinationAgentStrategy();
            case "itinerary":
                return new ItineraryAgentStrategy();
            case "hotel":
                {
                    const instance = await HotelAgentStrategy.getInstance(tripID || "");
                    return instance;
                }
        }
    }
}