import ICopilotService from "../../Interface/ClassInterface/ICopilotService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CopilotClientFactory from "../../Factory/CopilotClientFactory";
import CoordinatorPrompt from "../../Prompt/CoordinatorPrompt";
import DestinationPrompt from "../../Prompt/DestinationPrompt";
import ITripChat from "../../Interface/DataInterface/ITripChat";
import {RouteResult,} from "../../Interface/DataInterface/ICopilot";
import ITripHistory from "../../Interface/DataInterface/ITripHistory";
import AgentFactory from "./Agent/AgentFactory";

export default class CopilotService implements ICopilotService {

  private genrateTripHistory = (history:Array<ITripChat>) : Array<ITripHistory> => {
    return history.map(chat => ({
      userPrompt: chat.message,
      agentResponse: chat.response,
    }));
  }

  private async getRoute(prompt: string): Promise<RouteResult> {
    const copilotClientInstance = CopilotClientFactory.getInstance();

    const session = await copilotClientInstance.createSession({
      sessionId: `route-${Date.now()}`,
      model: "gpt-5.4",
      availableTools: [],
      systemMessage: {
        content: CoordinatorPrompt,
      },
    });

    const response = await session.sendAndWait({ prompt });
    await session.disconnect();

    try {
      return JSON.parse(response?.data?.content || "{}");
    } catch {
      return {
        route: "fallback",
        reason: "Invalid routing response",
      };
    }
  }

  coordinatorAgent = async (prompt: string,history: Array<ITripChat>): Promise<APIResponseInterface<any>> => {
    const coordinatorResponse = await this.getRoute(prompt);
    const { route } = coordinatorResponse;
    console.log("Route determined by coordinator agent:", route);
    switch (route) {
      case "destination-agent":
        const destinationStrategyInstance =  AgentFactory.createAgent("destination");
        const destinationData = await destinationStrategyInstance.executeAgent(prompt);
        if (!destinationData) {
          return {
            success: false,
            data: {
              message: "Failed to generate destination suggestions.",
            },
          };
        }
        return {
          success: true,
          data: destinationData,
        };
      case "hotel-agent":
        const hotelStrategyInstance = AgentFactory.createAgent("hotel");
        const hotelData = await hotelStrategyInstance.executeAgent(prompt);
        if (!hotelData ||!Array.isArray(hotelData.hotels) ||hotelData.hotels.length === 0) {
          return {
            success: true,
            data: {
              description:
                "Unable to fetch hotels for the requested location because the hotel search failed.",
              hotels: [],
            },
          };
        }

        return {
          success: true,
          data: hotelData,
        };
      case "itinerary-agent":
        const itinerayStrategyInstance = AgentFactory.createAgent("itinerary");
        return {success : true , data : await itinerayStrategyInstance.executeAgent(prompt, this.genrateTripHistory(history))};
      default:
        return { success: true, data: {
            message:
              "I can help with travel and destination suggestions. Tell me the kind of place you'd like to visit, such as mountains, beaches, adventure, or a romantic getaway.",
          },
        };
    }
  };
}
