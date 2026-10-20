import ITripChat from "../DataInterface/ITripChat";
import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export default interface ICopilotService {
    coordinatorAgent: (prompt: string, history: Array<ITripChat> , tripID: string , userID: number) => Promise<APIResponseInterface<string>>;
}