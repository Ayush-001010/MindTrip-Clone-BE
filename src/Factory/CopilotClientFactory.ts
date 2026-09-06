import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";

export default class CopilotClientFactory {
    private static instance:  CopilotClient | undefined;
    private constructor() {}
    public static getInstance() {
        if(!CopilotClientFactory.instance) {
            CopilotClientFactory.instance = new CopilotClient({
                connection: RuntimeConnection.forUri("localhost:4321"),
                mode: "empty",
            });
        }
        return CopilotClientFactory.instance;
    }
}