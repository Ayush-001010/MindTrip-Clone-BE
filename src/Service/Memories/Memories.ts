import IMemories, { IMemoriesAgent, IMemoriesCreateOpt, IMemoriesReadOpt } from "../../Interface/ClassInterface/IMemories";
import MemoriesAgent from "./Agent/MemoriesAgent";
import IMemoriesData from "../../Interface/DataInterface/IMemoriesData";
import { ICharacterAnalysisResult, MascotColorMode } from "../../Interface/DataInterface/ICharacterSpecification";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CreateMemories from "./Create/CreateMemories";
import ReadMemories from "./Read/ReadMemories";

export default class Memories implements IMemories {
    createOpt : IMemoriesCreateOpt;
    readOpt : IMemoriesReadOpt;
    agentOpt : IMemoriesAgent;

    constructor() {
        this.createOpt = new CreateMemories();
        this.readOpt = new ReadMemories();
        this.agentOpt = new MemoriesAgent();
    }


    fetchMemory(userId: number): Promise<APIResponseInterface<IMemoriesData[]>> {
        return this.readOpt.fetchMemory(userId);
    }

    createNewMemory(userId: number, name: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.createNewMemory(userId, name);
    }

    inviteUser(userName: string, workId: string, base62: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.inviteUser(userName, workId, base62);
    }

    fetchParticularMemoryDetails(workId: string): Promise<APIResponseInterface<IMemoriesData>> {
        return this.readOpt.fetchParticularMemoryDetails(workId);
    }

    fetchParticularMemoryDetailsForInvite(base62: string): Promise<APIResponseInterface<IMemoriesData>> {
        return this.readOpt.fetchParticularMemoryDetailsForInvite(base62);
    }
    
    userAddedToMemory(userId: string, base62: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.userAddedToMemory(userId, base62);
    }

    convertImageToCartoon(filePath: string, colorMode?: MascotColorMode): Promise<APIResponseInterface<ICharacterAnalysisResult>> {
        return this.agentOpt.convertImageToCartoon(filePath, colorMode);
    }
}