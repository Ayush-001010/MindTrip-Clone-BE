import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import ITripHistory from "../../../../Interface/DataInterface/ITripHistory";
import FavouritePrompt from "../../../../Prompt/FavouritePrompt";
import CommonService from "../../../Common/CommonService";
import FaviouritesService from "../../../FaviouritesService/FaviouritesService";
import FavouriteInformationGather from "../../../../Prompt/FavouriteInformationGather";
import FavouriteItineraryCreation from "../../../../Prompt/FavouriteItineraryCreation";
import path from "path";
import fs from "fs";

const logFavouriteToolCall = (message: string) => {
    try {
        const debugDir = path.resolve(process.cwd(), "debug");
        fs.mkdirSync(debugDir, { recursive: true });
        fs.appendFileSync(
            path.join(debugDir, "favouriteTools.log"),
            `${new Date().toISOString()} - ${message}\n`,
        );
    } catch (e) {
        console.error("Failed to write favouriteTools debug log:", e);
    }
};

export default class FavouriteAgent implements IAgentStrategy {
    private userID : number = 0;

    constructor(userID: number) {
        this.userID = userID;
    }

    // Deterministic data fetch, used instead of relying on the model to call a tool.
    private getFavouriteNamesForUser = async (): Promise<string[]> => {
        const commonService = new CommonService();
        const userDetails = await commonService.fetchUserDetails(this.userID);
        console.log("User details fetched for favourite names:", userDetails);
        const { email } = userDetails.data || {};
        console.log("User Email :",email);
        const favouriteServiceInstance = new FaviouritesService();
        const favouriteNames = await favouriteServiceInstance.getCollections(email);
        console.log("Favourite names fetched for user:", favouriteNames);
        if (favouriteNames.success && favouriteNames.data && favouriteNames.data.length > 0) {
            return favouriteNames.data.map((item: any) => item.name);
        }
        return [];
    };

    // Deterministic data fetch, used instead of relying on the model to call a tool.
    private getFavouritePlacesForUser = async (name: string): Promise<string[]> => {
        const commonService = new CommonService();
        const userDetails = await commonService.fetchUserDetails(this.userID);
        const { email } = userDetails.data || {};
        const favouriteServiceInstance = new FaviouritesService();
        const favourites = await favouriteServiceInstance.getCollections(email);
        if (favourites.success && favourites.data) {
            const match : any = favourites.data.find((item: any) => item.name === name);
            if (match) {
                const favouriteDetails = await favouriteServiceInstance.getCollectionDetails(match.id, "Activity");
                if (favouriteDetails.success && favouriteDetails.data) {
                    return (favouriteDetails.data as any[]).map((item) => item.placeName);
                }
            }
        }
        return [];
    };

    // Heuristically finds which favourite/collection name (if any) the user has already
    // selected, by scanning the current prompt and history for an exact name match.
    private findSelectedFavouriteName = (prompt: string, history: Array<ITripHistory>, availableFavouriteNames: string[]): string | null => {
        const haystack = [prompt, ...history.map((h) => h.userPrompt || "")].join(" ").toLowerCase();
        for (const name of availableFavouriteNames) {
            if (haystack.includes(name.toLowerCase())) {
                return name;
            }
        }
        return null;
    };

    private favouriteQuestionGatherAgent = async (prompt: string, history: Array<ITripHistory>) => {
        console.log("Prompt received by favourite question gather agent:", prompt);

        const availableFavouriteNames = await this.getFavouriteNamesForUser();
        const selectedFavouriteName = this.findSelectedFavouriteName(prompt, history, availableFavouriteNames);
        const availableFavouritePlaces = selectedFavouriteName
            ? await this.getFavouritePlacesForUser(selectedFavouriteName)
            : [];

        logFavouriteToolCall(
            `Prefetched for question-gather: availableFavouriteNames=${JSON.stringify(availableFavouriteNames)}, selectedFavouriteName=${selectedFavouriteName}, availableFavouritePlaces=${JSON.stringify(availableFavouritePlaces)}`
        );

        const copilotClientInstance = CopilotClientFactory.getInstance();
        const session = await copilotClientInstance.createSession({
            sessionId: `favourite-question-gather-${Date.now()}`,
            model: "gpt-5.4",
            availableTools: [],
            systemMessage: {
                content: FavouriteInformationGather
            },
        });

        const response = await session.sendAndWait({
        prompt: JSON.stringify({
          history,
          userPrompt: prompt,
          availableFavouriteNames,
          availableFavouritePlaces,
        }),
      });
      await session.disconnect();

      try {
        console.log("Response from favourite question gather agent:", response?.data?.content);
        return JSON.parse(response?.data?.content || "{}");
      } catch {
        return {
          route: "fallback-agent",
        };
      }

    };

    private favouriteItineraryAgent = async (prompt: string, history: Array<ITripHistory>) => {
       const availableFavouriteNames = await this.getFavouriteNamesForUser();
       const selectedFavouriteName = this.findSelectedFavouriteName(prompt, history, availableFavouriteNames);
       const availableFavouritePlaces = selectedFavouriteName
           ? await this.getFavouritePlacesForUser(selectedFavouriteName)
           : [];

       logFavouriteToolCall(
           `Prefetched for itinerary creation: selectedFavouriteName=${selectedFavouriteName}, availableFavouritePlaces=${JSON.stringify(availableFavouritePlaces)}`
       );

       const copilotClientInstance = CopilotClientFactory.getInstance();
        const session = await copilotClientInstance.createSession({
            sessionId: `favourite-itinerary-${Date.now()}`,
            model: "gpt-5-mini",
            availableTools: [],
            systemMessage: {
                content: FavouriteItineraryCreation
            },
        });

        const response = await session.sendAndWait({
        prompt: JSON.stringify({
          history,
          userPrompt: prompt,
          availableFavouritePlaces,
        }),
      });
      await session.disconnect();

      try {
        console.log("Response from favourite itinerary agent:", response?.data?.content);
        return JSON.parse(response?.data?.content || "{}");
      } catch {
        return {
          route: "fallback-agent",
        };
      }
    };

    private getRoute = async (prompt: string,history: Array<ITripHistory>,): Promise<{ route: "favourite-question-gather-agent" | "fallback-agent" | "favourite-itinerary-agent" }> => {
        try {
        const copilotClientInstance = CopilotClientFactory.getInstance();

        console.log("Prompt for routing:", prompt);
        // console.log("History for routing:", history);

        const session = await copilotClientInstance.createSession({
            sessionId: `route-${Date.now()}`,
            model: "gpt-5-mini",
            availableTools: [],
            systemMessage: {
            content: FavouritePrompt,
            },
        });

        const response = await session.sendAndWait({
            prompt: JSON.stringify({
            history,
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

    executeAgent = async (userPrompt: string,history?: Array<ITripHistory>) => {
        const coordinates = await this.getRoute(userPrompt, history || []);
        const { route } = coordinates;
        console.log("Route determined by FavouriteAgent:", route);
        switch (route) {
            case "favourite-question-gather-agent":
                const favouriteInformation = await this.favouriteQuestionGatherAgent(userPrompt, history || []);
                return favouriteInformation;
            case "favourite-itinerary-agent":
                const favouriteItinerary = await this.favouriteItineraryAgent(userPrompt, history || []);
                return favouriteItinerary;
            case "fallback-agent":
                return { route: "fallback-agent" , message : "Something went wrong"};
                // break; (no longer needed since we are returning)
            default:
                // Handle unknown routes
                break;
        }
    };
}
