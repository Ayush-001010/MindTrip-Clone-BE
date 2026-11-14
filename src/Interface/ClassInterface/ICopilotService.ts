import ITripChat from "../DataInterface/ITripChat";
import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import type { MascotColorMode } from "../DataInterface/ICharacterSpecification";

export default interface ICopilotService {
    coordinatorAgent: (prompt: string, history: Array<ITripChat> , tripID: string , userID: number, base64Image?: Buffer, colorMode?: MascotColorMode) => Promise<APIResponseInterface<string>>;
}