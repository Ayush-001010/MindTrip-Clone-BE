import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";
import path from "node:path";

export default class CopilotClientFactory {
    private static instance:  CopilotClient | undefined;
    private constructor() {}
    public static getInstance() {
        if(!CopilotClientFactory.instance) {
            CopilotClientFactory.instance = new CopilotClient({
                connection: RuntimeConnection.forStdio(),
                mode: "empty",
                baseDirectory: path.resolve(process.cwd(), ".copilot-runtime"),
            });
        }
        return CopilotClientFactory.instance;
    }
}