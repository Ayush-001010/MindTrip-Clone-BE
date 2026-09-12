import ICopilotService from "../../Interface/ClassInterface/ICopilotService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CopilotClientFactory from "../../Factory/CopilotClientFactory";
import CoordinatorPrompt from "../../Prompt/CoordinatorPrompt";
import DestinationPrompt from "../../Prompt/DestinationPrompt";
import ITripChat from "../../Interface/DataInterface/ITripChat";
import IHotel from "../../Interface/DataInterface/IHotel";
import {
  RouteResult,
  DestinationResult,
  HotelAgentResult,
} from "../../Interface/DataInterface/ICopilot";
import fs from "fs";
import path from "path";
import HotelService from "../Hotels/HotelService";
import HotelPrompt from "../../Prompt/HotelPrompt";
import { defineTool } from "@github/copilot-sdk";
import ItineraryPrompt from "../../Prompt/ItineraryPrompt";
import InformationGatherPrompt from "../../Prompt/InformationGatherPrompt";
import ItineraryPlannerAgent from "../../Prompt/ItineraryPlannerAgent";
import ItineraryAgentStrategy from "../Agent/ItineraryAgent/ItineraryAgentStrategy";
import ITripHistory from "../../Interface/DataInterface/ITripHistory";

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

  private async runDestinationAgent(
    prompt: string,
  ): Promise<DestinationResult | null> {
    const copilotClientInstance = CopilotClientFactory.getInstance();

    const session = await copilotClientInstance.createSession({
      sessionId: `destination-${Date.now()}`,
      model: "gpt-5.4",
      availableTools: [],
      systemMessage: {
        content: DestinationPrompt,
      },
    });

    const response = await session.sendAndWait({ prompt });
    await session.disconnect();

    try {
      return JSON.parse(response?.data?.content || "{}");
    } catch {
      return null;
    }
  }

  private searchHotel = defineTool("searchHotel", {
    description: "Search hotels based on the provided city",
    skipPermission: true,
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
        },
      },
      required: ["location"],
    },
    handler: async ({ location }: { location: string }): Promise<IHotel[]> => {
      try {
        const debugDir = path.resolve(process.cwd(), "debug");
        fs.mkdirSync(debugDir, { recursive: true });
        fs.appendFileSync(
          path.join(debugDir, "searchHotel.log"),
          `${new Date().toISOString()} - called with location: ${location}\n`,
        );
      } catch (e) {
        console.error("Failed to write searchHotel debug log:", e);
      }

      const hotelServiceInstance = new HotelService();
      const checkInDate = new Date();
      const checkOutDate = new Date();
      checkOutDate.setDate(checkInDate.getDate() + 2);

      let hotels: IHotel[] = [];
      try {
        hotels = await hotelServiceInstance.getHotels(
          location,
          checkInDate.toISOString().split("T")[0],
          checkOutDate.toISOString().split("T")[0],
          2,
        );
      } catch (err) {
        console.error("searchHotel tool error:", err);
        try {
          fs.appendFileSync(
            path.resolve(process.cwd(), "debug", "searchHotel.log"),
            `${new Date().toISOString()} - error: ${String(err)}\n`,
          );
        } catch (e) {
          console.error("Failed to append error to searchHotel debug log:", e);
        }
        hotels = [];
      }

      try {
        fs.appendFileSync(
          path.resolve(process.cwd(), "debug", "searchHotel.log"),
          `${new Date().toISOString()} - returned count: ${hotels?.length ?? 0}\n`,
        );
      } catch (e) {
        console.error("Failed to append result to searchHotel debug log:", e);
      }
      return hotels;
    },
  });

  private async runHotelAgent(prompt: string,history: Array<ITripChat>): Promise<HotelAgentResult | null> {
    const copilotClientInstance = CopilotClientFactory.getInstance();

    const session = await copilotClientInstance.createSession({
      sessionId: `hotel-${Date.now()}`,
      model: "gpt-5.4",
      tools: [this.searchHotel],
      availableTools: ["searchHotel"],
      systemMessage: {
        content: HotelPrompt,
      },
    });

    const response = await session.sendAndWait({
      prompt: `${prompt}`,
    });

    // console.log("Hotel agent raw response object:", response);

    await session.disconnect();

    // return response;
    try {
      return JSON.parse(response?.data?.content || "{}");
    } catch {
      return null;
    }
  };

  private async runItineraryAgent(prompt: string,history: Array<ITripChat>): Promise<any> {
    const copilotClientInstance = CopilotClientFactory.getInstance();
    const formattedHistory = history.map((chat) => ({
      Assistant: chat.message,
      Agent: chat.response,
    }));
    const itineraryPrompt = JSON.stringify({
      userPrompt: prompt,
      history: formattedHistory,
    });

    const session = await copilotClientInstance.createSession({
      sessionId: `itinerary-${Date.now()}`,
      model: "gpt-5.4",
      tools: [],
      availableTools: [],
      customAgents:[
        {
          name: "information-gather-agent",
          description: "This agent gathers necessary information from the user to create a personalized itinerary.",
          tools:[],
          prompt: InformationGatherPrompt,
        },
        {
          name : "itinerary-planning-agent",
          description: "This agent creates personalized itinerary plans based on the gathered information.",
          tools:[],
          prompt: ItineraryPlannerAgent,
        },
        {
          name : "destination-agent",
          description: "This agent provides destination suggestions based on user preferences.",
          tools:[],
          prompt: DestinationPrompt,
        },
        {
          name:"itinerary-agent",
          description: "This agent manages the overall itinerary planning process.",
          tools:[],
          prompt: ItineraryPrompt,
        }
      ],
      onPermissionRequest: async () => ({ kind: "approve-once" }),
      agent:"itinerary-agent"
    });

    session.on((event) => {
      console.log("Session event:", {
        agentId: event.agentId ?? "root",
        type: event.type,
        data: event.data,
      });

      if (event.agentId) {
        console.log("Sub-agent event:", {
          agentId: event.agentId,
          type: event.type,
          data: event.data,
        });
      }
    });

    const response = await session.sendAndWait({
      prompt: itineraryPrompt,
    });

    await session.disconnect();

    try {
      return JSON.parse(response?.data?.content || "{}");
    } catch {
      return null;
    }
  }


  coordinatorAgent = async (prompt: string,history: Array<ITripChat>): Promise<APIResponseInterface<any>> => {
    const coordinatorResponse = await this.getRoute(prompt);
    const { route } = coordinatorResponse;

    console.log("Route determined by coordinator agent:", route);

    switch (route) {
      case "destination-agent":
        const destinationData = await this.runDestinationAgent(prompt);

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
        const hotelData = await this.runHotelAgent(prompt, history);

        // If the hotel agent failed to generate a response or returned no hotels,
        // return a successful API response with an explanatory description and
        // an empty hotels array so the client can handle it gracefully.
        if (
          !hotelData ||
          !Array.isArray(hotelData.hotels) ||
          hotelData.hotels.length === 0
        ) {
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
        const itinerayStrategyInstance = new ItineraryAgentStrategy();
        return {success : true , data : await itinerayStrategyInstance.executeAgent(prompt, this.genrateTripHistory(history))};
        // break;
      default:
        return {
          success: true,
          data: {
            message:
              "I can help with travel and destination suggestions. Tell me the kind of place you'd like to visit, such as mountains, beaches, adventure, or a romantic getaway.",
          },
        };
    }
  };
}
