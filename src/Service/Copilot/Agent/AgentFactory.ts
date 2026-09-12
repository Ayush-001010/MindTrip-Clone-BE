import DestinationAgentStrategy from "./DestinationAgent/DestinationAgentStrategy";
import ItineraryAgentStrategy from "./ItineraryAgent/ItineraryAgentStrategy";
import HotelAgentStrategy from "./HotelAgent/HotelAgentStrategy";

export default class AgentFactory {
    public static createAgent(agentType:"destination" | "itinerary" | "hotel") {
        switch(agentType) {
            case "destination":
                return new DestinationAgentStrategy();
            case "itinerary":
                return new ItineraryAgentStrategy();
            case "hotel":
                return new HotelAgentStrategy();
        }
    }
}