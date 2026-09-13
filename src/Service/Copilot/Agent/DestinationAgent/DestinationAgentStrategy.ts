import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import DestinationPrompt from "../../../../Prompt/DestinationPrompt";

export default class DestinationAgentStrategy implements IAgentStrategy {
  executeAgent = async (prompt: string) => {
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
  };
}
