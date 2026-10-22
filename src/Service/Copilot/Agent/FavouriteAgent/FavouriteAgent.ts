import { LIGHT_MODEL } from "../../../../config/models";
import { defineTool } from "@github/copilot-sdk";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import ITripHistory from "../../../../Interface/DataInterface/ITripHistory";
import FavouritePrompt from "../../../../Prompt/FavouritePrompt";
import FaviouritesService from "../../../FaviouritesService/FaviouritesService";
import UserService from "../../../User/UserService";
import FavouriteInformationGatherRoundOne from "../../../../Prompt/FavouriteInformationGatherRoundOne";
import FavouriteInformationGatherRoundSecond from "../../../../Prompt/FavouriteInformationGatherRoundSecond";
import FavouriteItineraryCreation from "../../../../Prompt/FavouriteItineraryCreation";


export default class FavouriteAgent implements IAgentStrategy {
    private userID : number = 0;

    private fetchFavouriteNames = defineTool("fetchFavouriteNames",{
        description: "Fetch the list of favourite names for the user",
        skipPermission: true,
        parameters: {
            type: "object",
            properties: {},
        },
        handler : async () => {
            console.log("I am start executing fetchFavouriteNames with userID:", this.userID);
            const userInstance = new UserService();
            const userDetails = await userInstance.fetchUserDetails(this.userID.toString());
            console.log("User Details: ", userDetails);
            const {email} = userDetails || {};
            const favouriteInstance = new FaviouritesService();
            const response = await favouriteInstance.getCollections(email || "");
            console.log("Favourite Collections Response: ", response);
            return response.data || [];
        }
    });

    private fetchFavouriteDetails = defineTool("fetchFavouriteDetails",{
        description: "Fetch the details of the selected favourite collection which selected by the user",
        skipPermission: true,
        parameters: {
            type: "object",
            properties: {
                favouriteName: {
                    type: "string",
                },
            },
        },
        handler : async ({favouriteName}: {favouriteName: string}) => {
            console.log("I am start executing fetchFavouriteDetails with userID:", this.userID, "and favouriteName:", favouriteName);
            const userInstance = new UserService();
            const userDetails = await userInstance.fetchUserDetails(this.userID.toString());
            console.log("User Details: ", userDetails);
            const {email} = userDetails || {};
            const favouriteInstance = new FaviouritesService();
            const response = await favouriteInstance.getCollections(email || "");
            let favouriteID = 0;
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach((f: any) => {
                    if (f.dataValues.name === favouriteName) {
                        favouriteID = f.dataValues.id;
                    }
                });
            }
            console.log("Favourite Collection ID: ", favouriteID);
            const favouriteDetails = await favouriteInstance.getCollectionDetails(favouriteID,"Activity");
            console.log("Favourite Collection Details: ", favouriteDetails);
            return favouriteDetails.data || [];
        }
    });

    constructor(userID: number) {
        this.userID = userID;
    }

    private questionGatherRound1 = async (prompt:string) => {
        console.log("Starting question gather round1 with prompt:", prompt);
        const copilotClientInstance = CopilotClientFactory.getInstance();
        const session = await copilotClientInstance.createSession({ 
            sessionId: `favourite-question-gather-round1-${Date.now()}`,
            model: LIGHT_MODEL,
            systemMessage: {
                content: FavouriteInformationGatherRoundOne,
            },
            tools: [this.fetchFavouriteNames],
            availableTools: ["fetchFavouriteNames"],
        });

        const response = await session.sendAndWait({
            prompt: JSON.stringify({
            userPrompt: prompt,
            }),
        });
        await session.disconnect();

        try {
            console.log("Response from favourite question gather round1 agent:", response?.data?.content);
            return JSON.parse(response?.data?.content || "{}");
        } catch {
            return {
            route: "fallback-agent",
            };
        }
    }

    private questionGatherRound2 = async (prompt:string) => {
        console.log("Starting question gather round2 with prompt:", prompt);
        const copilotClientInstance = CopilotClientFactory.getInstance();
        const session = await copilotClientInstance.createSession({ 
            sessionId: `favourite-question-gather-round2-${Date.now()}`,
            model: LIGHT_MODEL,
            systemMessage: {
                content: FavouriteInformationGatherRoundSecond,
            },
            tools: [this.fetchFavouriteDetails],
            availableTools: ["fetchFavouriteDetails"],
        });

        const response = await session.sendAndWait({
            prompt: JSON.stringify({
            userPrompt: prompt,
            }),
        });
        await session.disconnect();

        try {
            console.log("Response from favourite question gather round2 agent:", response?.data?.content);
            return JSON.parse(response?.data?.content || "{}");
        } catch {
            return {
            route: "fallback-agent",
            };
        }
    }

    private favouriteItineraryAgent = async (prompt: string) => {
        console.log("Starting favourite itinerary agent with prompt:", prompt);
        const copilotClientInstance = CopilotClientFactory.getInstance();
        const session = await copilotClientInstance.createSession({
            sessionId: `favourite-itinerary-agent-${Date.now()}`,
            model: LIGHT_MODEL,
            systemMessage: {
                content: FavouriteItineraryCreation,
            },
            tools: [],
            availableTools: [],
        });

        const response = await session.sendAndWait({
            prompt: JSON.stringify({
            userPrompt: prompt,
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
    }

    private getRoute = async (prompt: string,history: Array<ITripHistory>,): Promise<{ route: "favourite-question-gather-round1" | "favourite-question-gather-round2" | "fallback-agent" | "favourite-itinerary-agent" }> => {
        try {
        const copilotClientInstance = CopilotClientFactory.getInstance();

        console.log("Prompt for routing:", prompt);
        // console.log("History for routing:", history);

        const session = await copilotClientInstance.createSession({
            sessionId: `route-${Date.now()}`,
            model: LIGHT_MODEL,
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
            case "favourite-question-gather-round1":
                return await this.questionGatherRound1(userPrompt);
            case "favourite-question-gather-round2":
                return await this.questionGatherRound2(userPrompt);
            case "favourite-itinerary-agent":
                return await this.favouriteItineraryAgent(userPrompt);
            case "fallback-agent":
                return { route: "fallback-agent" , message : "Something went wrong"};
                // break; (no longer needed since we are returning)
            default:
                // Handle unknown routes
                return { route: "fallback-agent" , message : "Unknown route"};
        }
    };
}
