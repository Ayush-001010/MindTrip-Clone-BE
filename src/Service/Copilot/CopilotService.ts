import ICopilotService from "../../Interface/ClassInterface/ICopilotService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CopilotClientFactory from "../../Factory/CopilotClientFactory";
import CoordinatorPrompt from "../../Prompt/CoordinatorPrompt";
import DestinationPrompt from "../../Prompt/DestinationPrompt";

interface RouteResult {
  route: "destination-agent" | "fallback";
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

  coordinatorAgent = async (prompt: string): Promise<APIResponseInterface<any>> => {
    const route = await this.getRoute(prompt);

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