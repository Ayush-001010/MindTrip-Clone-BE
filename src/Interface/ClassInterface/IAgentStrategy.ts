import ITripHistory from "../DataInterface/ITripHistory";
import type { MascotColorMode } from "../DataInterface/ICharacterSpecification";

export default interface IAgentStrategy {
    executeAgent: (userPrompt: string , history?: Array<ITripHistory>, base64Image?: Buffer, colorMode?: MascotColorMode) => any;
}