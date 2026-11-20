import IMemories, { IMemoriesAgent, IMemoriesCreateOpt, IMemoriesReadOpt, IMemoriesReelAnalysisBatch, IMemoryVisualMedia } from "../../Interface/ClassInterface/IMemories";
import MemoriesAgent from "./Agent/MemoriesAgent";
import IMemoriesData from "../../Interface/DataInterface/IMemoriesData";
import { ICharacterAnalysisResult, MascotColorMode } from "../../Interface/DataInterface/ICharacterSpecification";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CreateMemories from "./Create/CreateMemories";
import ReadMemories from "./Read/ReadMemories";
import IMemoriesChat from "../../Interface/DataInterface/IMemoriesChat";

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

    changePlaceInMemory(placeName: string, id: number): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.changePlaceInMemory(placeName, id);
    }

    addMediaToMemory(memoryId: number, type: "pic" | "video" | "audio", url: string, tag?: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.addMediaToMemory(memoryId, type, url, tag);
    }

    addChatToMemory(memoryId: number, userMessage: string, actionType?: "Start" | "Other", userName?: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.addChatToMemory(memoryId, userMessage, actionType, userName);
    }

    fetchPlaceInMemory(id: number): Promise<APIResponseInterface<string[]>> {
        return this.readOpt.fetchPlaceInMemory(id);
    }

    fetchVisualMediaInMemory(memoryId: number, tag: string): Promise<APIResponseInterface<IMemoryVisualMedia[]>> {
        return this.readOpt.fetchVisualMediaInMemory(memoryId, tag);
    }

    createReelAnalysicBatch(memoryId: number, tagName: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.createReelAnalysicBatch(memoryId, tagName);
    }

    updateReelAnalysicBatchStatus(memoryId: number, tagName: string, status: "pending" | "completed" | "failed"): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.updateReelAnalysicBatchStatus(memoryId, tagName, status);
    }

    saveMediaAnalysisResult(mediaId: number, analysisResult: object): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.saveMediaAnalysisResult(mediaId, analysisResult);
    }

    fetchBatchReelAnalysis(memoryId: number): Promise<APIResponseInterface<IMemoriesReelAnalysisBatch[]>> {
        return this.readOpt.fetchBatchReelAnalysis(memoryId);
    }

    createMemoriesRoom(memoryId: number, name: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.createMemoriesRoom(memoryId, name);
    }

    fetchRoomChats(roomId: number): Promise<APIResponseInterface<IMemoriesChat[]>> {
        return this.readOpt.fetchRoomChats(roomId);
    }
    
    fetchAudioInMemory(memoryId: number): Promise<APIResponseInterface<IMemoryVisualMedia[]>> {
        return this.readOpt.fetchAudioInMemory(memoryId);
    }
}