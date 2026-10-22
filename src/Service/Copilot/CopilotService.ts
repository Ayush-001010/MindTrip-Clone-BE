import { HEAVY_MODEL } from "../../config/models";
import ICopilotService from "../../Interface/ClassInterface/ICopilotService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CopilotClientFactory from "../../Factory/CopilotClientFactory";
import CoordinatorPrompt from "../../Prompt/CoordinatorPrompt";
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
      model: HEAVY_MODEL,
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

  coordinatorAgent = async (prompt: string,history: Array<ITripChat> , tripID: string , userID : number): Promise<APIResponseInterface<any>> => {
    const coordinatorResponse = await this.getRoute(prompt);
    const { route } = coordinatorResponse;
    console.log("Route determined by coordinator agent:", route);
    switch (route) {
      case "destination-agent":
        const destinationStrategyInstance =  await AgentFactory.createAgent("destination");
        if (!destinationStrategyInstance) {
          return { success: false, data: { message: "Failed to create destination agent instance." } };
        }
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
        const hotelStrategyInstance = await AgentFactory.createAgent("hotel" , tripID);
        if (!hotelStrategyInstance) {
          return { success: true, data: { message: "Please create your itinerary first." } };
        }
        const hotelData = await hotelStrategyInstance.executeAgent(prompt, this.genrateTripHistory(history));

        return {
          success: true,
          data: hotelData,
        };
      case "itinerary-agent":
        const itinerayStrategyInstance = await AgentFactory.createAgent("itinerary");
        if (!itinerayStrategyInstance) {
          return { success : false, data: { message: "Failed to create itinerary agent instance." } }
        }
        return {success : true , data : await itinerayStrategyInstance.executeAgent(prompt, this.genrateTripHistory(history))};
      case "favourite-agent":
        const favouriteStrategyInstance = await AgentFactory.createAgent("favourite", tripID, userID);
        if (!favouriteStrategyInstance) {
          return { success: false, data: { message: "Failed to create favourite agent instance." } };
        }
        const favouriteData = await favouriteStrategyInstance.executeAgent(prompt, this.genrateTripHistory(history));
        return {
          success: true,
          data: favouriteData,
        };
      default:
        return { success: true, data: {
            message:"I can help with travel and destination suggestions. Tell me the kind of place you'd like to visit, such as mountains, beaches, adventure, or a romantic getaway.",
            type: "fallback"
          },
        };
    }
  };
}
