import ICopilotService from "../../Interface/ClassInterface/ICopilotService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CopilotClientFactory from "../../Factory/CopilotClientFactory";
import CoordinatorPrompt from "../../Prompt/CoordinatorPrompt";
import DestinationPrompt from "../../Prompt/DestinationPrompt";
import ITripChat from "../../Interface/DataInterface/ITripChat";
import IHotel from "../../Interface/DataInterface/IHotel";
import fs from "fs";
import path from "path";
import HotelService from "../Hotels/HotelService";
import HotelPrompt from "../../Prompt/HotelPrompt";
import { defineTool, ToolSet } from "@github/copilot-sdk";

interface RouteResult {
  route: "destination-agent" | "fallback" | "hotel-agent";
  reason: string;
}

interface DestinationResult {
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

interface HotelAgentResult {
  description: string;
  hotels: IHotel[];
}

export default class CopilotService implements ICopilotService {

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

  private async runDestinationAgent(prompt: string): Promise<DestinationResult | null> {
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
  }

  coordinatorAgent = async (prompt: string,history: Array<ITripChat>): Promise<APIResponseInterface<any>> => {
    const route = await this.getRoute(prompt);

    console.log("Route determined by coordinator agent:", route);

    if (route.route === "destination-agent") {
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
    } else if (route.route === "hotel-agent") {
      const hotelData = await this.runHotelAgent(prompt, history);

      // If the hotel agent failed to generate a response or returned no hotels,
      // return a successful API response with an explanatory description and
      // an empty hotels array so the client can handle it gracefully.
      if (!hotelData || !Array.isArray(hotelData.hotels) || hotelData.hotels.length === 0) {
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
    }

    return {
      success: true,
      data: {
        message:
          "I can help with travel and destination suggestions. Tell me the kind of place you'd like to visit, such as mountains, beaches, adventure, or a romantic getaway.",
      },
    };
  };
}
