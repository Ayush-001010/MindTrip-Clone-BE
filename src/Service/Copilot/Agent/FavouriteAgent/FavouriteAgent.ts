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
import Trip from "../../../Trip/Trip";

export default class FavouriteAgent implements IAgentStrategy {
    private tripID: string;
private userID: number;

constructor(tripID: string, userID: number) {
    this.tripID = tripID;
    this.userID = userID;
}
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
    private fetchAvailableFavouritePlaces = async (
        history: Array<ITripHistory>,
        prompt: string
    ): Promise<string[]> => {
        try {
            // 1. Fetch current user's details
            const userInstance = new UserService();
    
            const userDetails = await userInstance.fetchUserDetails(
                this.userID.toString()
            );
    
            const email = userDetails?.email;
    
            if (!email) {
                return [];
            }
    
            // 2. Fetch all collections belonging to the user
            const favouriteInstance = new FaviouritesService();
    
            const collectionsResponse =
                await favouriteInstance.getCollections(email);
    
            if (!collectionsResponse.success || !collectionsResponse.data) {
                return [];
            }
    
            // 3. Identify the collection selected in the conversation
            const conversationText = [
                ...history.map(item => item.userPrompt),
                prompt
            ].join(" ").toLowerCase();
    
            const collections = collectionsResponse.data.map((collection: any) =>
                collection.dataValues ?? collection
            );
    
            const selectedCollection = collections.find((collection: any) =>
                collection.name &&
                conversationText.includes(collection.name.toLowerCase())
            );
    
            if (!selectedCollection) {
                console.log("Selected collection not found.");
                return [];
            }
    
            // 4. Fetch saved activities from the selected collection
            const favouriteDetails =
                await favouriteInstance.getCollectionDetails(
                    Number(selectedCollection.id),
                    "Activity"
                );
    
            if (!favouriteDetails.success || !Array.isArray(favouriteDetails.data)) {
                return [];
            }
    
            // 5. Extract place names
            const availablePlaces = favouriteDetails.data.map((item: any) => {
                const activity = item.dataValues ?? item;
                return activity.activityName || activity.placeName;
            }).filter((name): name is string =>
                typeof name === "string" && name.trim().length > 0
            );
    
            console.log("Available favourite places:", availablePlaces);
    
            return availablePlaces;
    
        } catch (error) {
            console.error("Error fetching favourite places:", error);
            return [];
        }
    };
    

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
    };

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
    };

    private favouriteItineraryAgent = async (
        prompt: string,
        history: Array<ITripHistory>
    ) => {
        console.log("Starting favourite itinerary agent:", prompt);
    
        // Fetch saved places from the selected collection
        const availableFavouritePlaces =
            await this.fetchAvailableFavouritePlaces(history, prompt);
    
        if (availableFavouritePlaces.length === 0) {
            return {
                route: "fallback-agent",
                message: "No saved activities found in the selected collection."
            };
        }
    
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
                history,
                availableFavouritePlaces
            }),
        });
    
        await session.disconnect();
    
        try {
            const itinerary = JSON.parse(response?.data?.content || "{}");
        
            // Save the final itinerary into TripDetails
            if (itinerary.type === "final-itinerary") {
                const tripInstance = new Trip();
        
                await tripInstance.createFinalItinerary(
                    this.tripID,
                    itinerary.itineraryTitle,
                    itinerary
                );
        
                console.log("Favourite itinerary saved successfully.");
            }
        
            return itinerary;
        
        } catch (error) {
            console.error("Error creating favourite itinerary:", error);
        
            return {
                route: "fallback-agent",
                message: "Unable to generate or save the favourite itinerary."
            };
        }
    };
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
                    return await this.favouriteItineraryAgent(
                        userPrompt,
                        history || []
                    );
            case "fallback-agent":
                return { route: "fallback-agent" , message : "Something went wrong"};
                // break; (no longer needed since we are returning)
            default:
                // Handle unknown routes
                return { route: "fallback-agent" , message : "Unknown route"};
        }
    };
}
