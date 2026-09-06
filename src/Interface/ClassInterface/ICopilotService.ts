import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export default interface ICopilotService {
    coordinatorAgent: (prompt : string) => Promise<APIResponseInterface<string>>;
}