import { HEAVY_MODEL, LIGHT_MODEL } from "../../../../config/models";
import { defineTool } from "@github/copilot-sdk";
import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import HotelPrompt from "../../../../Prompt/HotelPrompt";
import IHotel from "../../../../Interface/DataInterface/IHotel";
import path from "path";
import fs from "fs";
import HotelService from "../../../Hotels/HotelService";
import CommonService from "../../../Common/CommonService";
import ITripHistory from "../../../../Interface/DataInterface/ITripHistory";
import HotelInformationGatherPrompt from "../../../../Prompt/HotelInformationGatherPrompt";
import HotelSearchPrompt from "../../../../Prompt/HotelSearchPrompt";

export default class HotelAgentStrategy implements IAgentStrategy {
  constructor(private finalItinerary: any) {}

  public static readonly getInstance = async (tripID: string) => {
    const isFinalItineraryExist =
      await CommonService.getInstance().checkIsFinalItineraryIsCreatedOrNot(
        tripID,
      );
    if (isFinalItineraryExist) {
      return new HotelAgentStrategy(isFinalItineraryExist);
    } else {
      return null;
    }
  };

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

      let hotels: IHotel[] = [];
      try {
        const { data } = await hotelServiceInstance.getHotels(
          location,
          1,
          4,
          2,
        );
        hotels = data;
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

  private getRoute = async ( prompt: string, history: Array<ITripHistory>): Promise<{route: "hotel-question-gather-agent"| "hotel-search-agent"| "fallback-agent";}> => {
    try {
      const copilotClientInstance = CopilotClientFactory.getInstance();

      console.log("Prompt for routing:", prompt);
      // console.log("History for routing:", history);
      console.log("Final itinerary for routing:", this.finalItinerary);

      const session = await copilotClientInstance.createSession({
        sessionId: `route-${Date.now()}`,
        model: LIGHT_MODEL,
        availableTools: [],
        systemMessage: {
          content: HotelPrompt,
        },
      });

      const response = await session.sendAndWait({
        prompt: JSON.stringify({
          history,
          finalItinerary: this.finalItinerary,
          userPrompt: prompt,
        }),
      });
      await session.disconnect();

      try {
        return JSON.parse(response?.data?.content || "{}");
      } catch {
        return {
          route: "fallback-agent",
        };
      }
    } catch (error) {
      return { route: "fallback-agent" };
    }
  };

  private hotelQuestionGatherAgent = async (prompt: string, history: Array<ITripHistory>) => {
    // Implement the logic for the hotel question gather agent here.
    const copilotClientInstance = CopilotClientFactory.getInstance();
    const session = await copilotClientInstance.createSession({
      sessionId: `hotel-question-gather-${Date.now()}`,
      model: HEAVY_MODEL,
      availableTools: [],
      systemMessage: {
        content: HotelInformationGatherPrompt,
      },
    });

    const response = await session.sendAndWait({
        prompt: JSON.stringify({
          history,
          finalItinerary: this.finalItinerary,
          userPrompt: prompt,
        }),
      });
      await session.disconnect();

      try {
        console.log("Response from hotel question gather agent:", response?.data?.content);
        return JSON.parse(response?.data?.content || "{}");
      } catch {
        return {
          route: "fallback-agent",
        };
      }
  };

  private hotelSearchAgent = async (prompt: string, history: Array<ITripHistory>) => {
    // Implement the logic for the hotel search agent here.
    const copilotClientInstance = CopilotClientFactory.getInstance();
    const session = await copilotClientInstance.createSession({
      sessionId: `hotel-search-${Date.now()}`,
      model: HEAVY_MODEL,
      tools: [this.searchHotel],
      availableTools: ["searchHotel"],
      systemMessage: {
        content: HotelSearchPrompt,
      },
    });

    const response = await session.sendAndWait({
        prompt: JSON.stringify({
          history,
          finalItinerary: this.finalItinerary,
          userPrompt: prompt,
        }),
      });
      await session.disconnect();

      try {
        console.log("Response from hotel search agent:", response?.data?.content);
        return JSON.parse(response?.data?.content || "{}");
      } catch {
        return {
          route: "fallback-agent",
        };
      }
  };

  executeAgent = async (prompt: string, history: Array<ITripHistory> = []) => {
    const coordinates = await this.getRoute(prompt, history);
    const { route } = coordinates;
    console.log("Route determined by hotel agent:", route);

    switch (route) {
      case "hotel-question-gather-agent":
        // Handle hotel question gather agent logic here
        return await this.hotelQuestionGatherAgent(prompt, history);
        break;
      case "hotel-search-agent":
        // Handle hotel search agent logic here
        return await this.hotelSearchAgent(prompt, history);
        break;
      case "fallback-agent":
        // Handle fallback agent logic here
        break;
      default:
        // Handle unknown route
        break;
    }

    return route;
  };
}
