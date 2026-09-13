import { defineTool } from "@github/copilot-sdk";
import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import HotelPrompt from "../../../../Prompt/HotelPrompt";
import { HotelAgentResult } from "../../../../Interface/DataInterface/ICopilot";
import IHotel from "../../../../Interface/DataInterface/IHotel";
import path from "path";
import fs from "fs";
import HotelService from "../../../Hotels/HotelService";

export default class HotelAgentStrategy implements IAgentStrategy {
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

 executeAgent = async (prompt: string): Promise<HotelAgentResult | null> => {
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
}