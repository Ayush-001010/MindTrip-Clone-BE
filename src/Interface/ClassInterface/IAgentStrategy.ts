import ITripHistory from "../DataInterface/ITripHistory";

export default interface IAgentStrategy {
    executeAgent: (userPrompt: string , history : Array<ITripHistory>) => any;
}