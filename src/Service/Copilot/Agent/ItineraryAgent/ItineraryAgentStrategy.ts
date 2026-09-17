import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import ITripHistory from "../../../../Interface/DataInterface/ITripHistory";
import ItineraryPrompt from "../../../../Prompt/ItineraryPrompt";
import ItineraryPlannerAgent from "../../../../Prompt/ItineraryPlannerAgent";
import InformationGatherPrompt from "../../../../Prompt/InformationGatherPrompt";
import ItineraryCreationAgent from "../../../../Prompt/ItineraryCreationAgent";

export default class ItineraryAgentStrategy implements IAgentStrategy {
    private static readonly SESSION_WAIT_TIMEOUT_MS = 180000;

    private createSessionId = (prefix: string) => `${prefix}-${Date.now()}`;

   
    private questionGratherAgent = async (prompt: string, history: Array<ITripHistory>) => {
        console.log("Starting questionGratherAgent with prompt:", prompt);
        const copilotInstance = CopilotClientFactory.getInstance();
        const session = await copilotInstance.createSession({
            model:"gpt-5-mini",
            sessionId:this.createSessionId("itinerary-question-gathering"),
            systemMessage :{
                content: InformationGatherPrompt
            },
            tools: [],
            availableTools: [],
        });

        try {
            const response = await session.sendAndWait({
                prompt: JSON.stringify({
                    userPrompt: prompt
                })
            }, ItineraryAgentStrategy.SESSION_WAIT_TIMEOUT_MS);

            return JSON.parse(response?.data?.content || "{}");
        } finally {
            await session.disconnect();
        }

    }

    private planningItineraryAgent = async (prompt: string, history: Array<ITripHistory>) => {
        const copilotInstance = CopilotClientFactory.getInstance();
        const session = await copilotInstance.createSession({
            model:"gpt-5.4",
            sessionId:this.createSessionId("itinerary-planning"),
            systemMessage :{
                content: ItineraryPlannerAgent
            },
            tools: [],
            availableTools: [],
        });

        try {
            const response = await session.sendAndWait({
                prompt: JSON.stringify({
                    history: history,
                    userPrompt: prompt
                })
            }, ItineraryAgentStrategy.SESSION_WAIT_TIMEOUT_MS);
            return JSON.parse(response?.data?.content || "{}");
        } finally {
            await session.disconnect();
        }
    }
    private creatingItineraryAgent = async (prompt: string, history: Array<ITripHistory>) => {
        const copilotInstance = CopilotClientFactory.getInstance();
        const session = await copilotInstance.createSession({
            model:"gpt-5.4",
            sessionId:this.createSessionId("itinerary-creation"),
            systemMessage :{
                content: ItineraryCreationAgent
            },
            tools: [],
            availableTools: [],
        });

        try {
            const response = await session.sendAndWait({
                prompt: JSON.stringify({
                    history: history,
                    userPrompt: prompt
                })
            }, ItineraryAgentStrategy.SESSION_WAIT_TIMEOUT_MS);
            return JSON.parse(response?.data?.content || "{}");
        } finally {
            await session.disconnect();
        }
    }

    executeAgent = async (prompt: string, history?: Array<ITripHistory>) => {
        
        // Decide which sub-agent to route the request to based on the user's input and history.
        const copilotInstance = CopilotClientFactory.getInstance();
        const session = await copilotInstance.createSession({
            model:"gpt-5-mini",
            sessionId:this.createSessionId("itinerary-routing"),
            systemMessage :{
                content: ItineraryPrompt
            },
            tools: [],
            availableTools: [],
        });

        let response;

        try {
            response = await session.sendAndWait({
                prompt: JSON.stringify({
                    history: history,
                    userPrompt: prompt
                })
            }, ItineraryAgentStrategy.SESSION_WAIT_TIMEOUT_MS);
        } finally {
            await session.disconnect();
        }

        let parsedResponse : { route: "information-gather-agent" | "itinerary-planning-agent" | "itinerary-creation-agent" };

        try{
            parsedResponse = JSON.parse(response?.data?.content || "{}");
        } catch(error){
            console.log("Error : ",error);
            return null;
        }
        console.log("Parsed response route: ", parsedResponse.route);

        // Send the user's prompt and history to the itinerary routing sub-agent session.

        switch(parsedResponse.route){
            case "information-gather-agent":
                const responseFromQuestionGratherAgent = await this.questionGratherAgent(prompt, history || []);
                return responseFromQuestionGratherAgent;
            case "itinerary-planning-agent":
                const responseFromPlanningItineraryAgent = await this.planningItineraryAgent(prompt, history || []);
                return responseFromPlanningItineraryAgent;
            case "itinerary-creation-agent":
                const responseFromCreatingItineraryAgent = await this.creatingItineraryAgent(prompt, history || []);
                return responseFromCreatingItineraryAgent;
            default:
                console.log("Unknown route, returning null.");
                return null;
        }
    }
}