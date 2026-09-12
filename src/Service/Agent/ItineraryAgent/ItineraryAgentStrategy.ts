import CopilotClientFactory from "../../../Factory/CopilotClientFactory";
import IAgentStrategy from "../../../Interface/ClassInterface/IAgentStrategy";
import ITripHistory from "../../../Interface/DataInterface/ITripHistory";
import ItineraryPrompt from "../../../Prompt/ItineraryPrompt";
import ItineraryPlannerAgent from "../../../Prompt/ItineraryPlannerAgent";
import InformationGatherPrompt from "../../../Prompt/InformationGatherPrompt";

export default class ItineraryAgentStrategy implements IAgentStrategy {
   
    private questionGratherAgent = async (prompt: string, history: Array<ITripHistory>) => {
        console.log("Starting questionGratherAgent with prompt:", prompt);
        const copilotInstance = CopilotClientFactory.getInstance();
        const session = await copilotInstance.createSession({
            model:"gpt-5-mini",
            sessionId:"itinerary-question-gathering-session",
            systemMessage :{
                content: InformationGatherPrompt
            },
            tools: [],
            availableTools: [],
        });
        const response = await session.sendAndWait({
            prompt: JSON.stringify({
                userPrompt: prompt
            })
        });

        return JSON.parse(response?.data?.content || "{}");

    }

    private planningItineraryAgent = async (prompt: string, history: Array<ITripHistory>) => {
        const copilotInstance = CopilotClientFactory.getInstance();
        const session = await copilotInstance.createSession({
            model:"gpt-5.4",
            sessionId:"itinerary-planning-session",
            systemMessage :{
                content: ItineraryPlannerAgent
            },
            tools: [],
            availableTools: [],
        });
        const response = await session.sendAndWait({
            prompt: JSON.stringify({
                history: history,
                userPrompt: prompt
            })
        });
        return JSON.parse(response?.data?.content || "{}");
    }

    executeAgent = async (prompt: string, history: Array<ITripHistory>) => {
        
        // Decide which sub-agent to route the request to based on the user's input and history.
        const copilotInstance = CopilotClientFactory.getInstance();
        const session = await copilotInstance.createSession({
            model:"gpt-5-mini",
            sessionId:"itinerary-routing-session",
            systemMessage :{
                content: ItineraryPrompt
            },
            tools: [],
            availableTools: [],
        });
        const response = await session.sendAndWait({
            prompt: JSON.stringify({
                history: history,
                userPrompt: prompt
            })
        });

        let parsedResponse : { route: "information-gather-agent" | "itinerary-planning-agent" };

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
                const responseFromQuestionGratherAgent = await this.questionGratherAgent(prompt, history);
                return responseFromQuestionGratherAgent;
            case "itinerary-planning-agent":
                const responseFromPlanningItineraryAgent = await this.planningItineraryAgent(prompt, history);
                return responseFromPlanningItineraryAgent;
            default:
                console.log("Unknown route, returning null.");
                return null;
        }
    }
}