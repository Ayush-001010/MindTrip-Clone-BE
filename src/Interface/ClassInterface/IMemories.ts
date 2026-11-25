import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IMemoriesData from "../../Interface/DataInterface/IMemoriesData";
import IMemoriesChat from "../../Interface/DataInterface/IMemoriesChat";
import { ICharacterAnalysisResult, MascotColorMode } from "../DataInterface/ICharacterSpecification";
import { IMusicAnalysis, IReelScript } from "../DataInterface/IReelPlan";

export interface IMemoryVisualMedia {
    id: number;
    type: "pic" | "video" | "audio";
    tag: string | null;
    url: string;
    isProcessed: boolean;
    analysisResult: string | null;
}

export interface IMemoriesReelAnalysisBatch {
    tagName: string;
    status: "pending" | "completed" | "failed";
}

export interface IMemoriesReelCreation {
    memoryId: number;
    roomId?: number;
    userName?: string;
    template : "Journey" | "Mistory" | "Key Moment" | "Fast Clip";
    soundtrack: string;
    soundtrackTitle?: string;
    musicStartSec?: number;
    mood : "Happy" | "Fun" | "Relaxing"| "Romantic";
    pace : "Slow" | "Medium" | "Fast";
    place : string[];
    userSuggestion?: string;
    targetSeconds?: { min: number; max: number };
}

export interface IReelPipelineResult {
    script: IReelScript;
    music?: IMusicAnalysis;
}

export interface IMemoriesReadOpt {
    fetchMemory: (userId : number) => Promise<APIResponseInterface<IMemoriesData[]>>;
    fetchParticularMemoryDetails: (workId : string) => Promise<APIResponseInterface<IMemoriesData>>;
    fetchParticularMemoryDetailsForInvite : (base62 : string) => Promise<APIResponseInterface<IMemoriesData>>;
    fetchPlaceInMemory: (id: number) => Promise<APIResponseInterface<string[]>>;
    fetchVisualMediaInMemory: (memoryId: number , tag : string) => Promise<APIResponseInterface<IMemoryVisualMedia[]>>;
    fetchBatchReelAnalysis: (memoryId: number) => Promise<APIResponseInterface<IMemoriesReelAnalysisBatch[]>>;
    fetchRoomChats: (roomId: number) => Promise<APIResponseInterface<IMemoriesChat[]>>;
    fetchAudioInMemory: (memoryId: number) => Promise<APIResponseInterface<IMemoryVisualMedia[]>>;
}
export interface IMemoriesCreateOpt {
    createNewMemory: (userId : number , name : string) => Promise<APIResponseInterface<boolean>>;
    inviteUser: (userName: string, workId: string, base62: string) => Promise<APIResponseInterface<boolean>>;
    userAddedToMemory:(userId : string , base62 : string) => Promise<APIResponseInterface<boolean>>;
    changePlaceInMemory:(placeName:string , id : number) => Promise<APIResponseInterface<boolean>>;
    addMediaToMemory: (memoryId: number, type: "pic" | "video" | "audio", url: string, tag?: string) => Promise<APIResponseInterface<boolean>>;
    addChatToMemory: (memoryId: number, userMessage: string, actionType?: "Start" | "Other", userName?: string) => Promise<APIResponseInterface<boolean>>;
    createReelChat: (request: IMemoriesReelCreation) => Promise<APIResponseInterface<number>>;
    updateReelChatResponse: (chatId: number, script: IReelScript) => Promise<APIResponseInterface<boolean>>;
    createReelAnalysicBatch: (memoryId: number, tagName: string) => Promise<APIResponseInterface<boolean>>;
    updateReelAnalysicBatchStatus: (memoryId: number, tagName: string, status: "pending" | "completed" | "failed") => Promise<APIResponseInterface<boolean>>;
    createMemoriesRoom: (memoryId: number, name: string) => Promise<APIResponseInterface<boolean>>;
    saveMediaAnalysisResult: (mediaId: number, analysisResult: object) => Promise<APIResponseInterface<boolean>>;
}

export interface IMemoriesAgent {
    convertImageToCartoon: (filePath: string, colorMode?: MascotColorMode) => Promise<APIResponseInterface<ICharacterAnalysisResult>>;
    createReelPipeLine : (reelCreationData: IMemoriesReelCreation) => Promise<APIResponseInterface<IReelPipelineResult>>;
}

export default interface IMemories {
    fetchMemory: (userId : number) => Promise<APIResponseInterface<IMemoriesData[]>>;
    createNewMemory: (userId : number , name : string) => Promise<APIResponseInterface<boolean>>;
    inviteUser: (userName: string, workId: string, base62: string) => Promise<APIResponseInterface<boolean>>;
    fetchParticularMemoryDetails: (workId : string) => Promise<APIResponseInterface<IMemoriesData>>;
    fetchParticularMemoryDetailsForInvite: (base62 : string) => Promise<APIResponseInterface<IMemoriesData>>;
    userAddedToMemory:(userId : string , base62 : string) => Promise<APIResponseInterface<boolean>>;
    convertImageToCartoon: (filePath: string, colorMode?: MascotColorMode) => Promise<APIResponseInterface<ICharacterAnalysisResult>>;
    changePlaceInMemory:(placeName:string , id : number) => Promise<APIResponseInterface<boolean>>;
    addMediaToMemory: (memoryId: number, type: "pic" | "video" | "audio", url: string, tag?: string) => Promise<APIResponseInterface<boolean>>;
    addChatToMemory: (memoryId: number, userMessage: string, actionType?: "Start" | "Other", userName?: string) => Promise<APIResponseInterface<boolean>>;
    createReelChat: (request: IMemoriesReelCreation) => Promise<APIResponseInterface<number>>;
    updateReelChatResponse: (chatId: number, script: IReelScript) => Promise<APIResponseInterface<boolean>>;
    fetchPlaceInMemory: (id: number) => Promise<APIResponseInterface<string[]>>;
    fetchVisualMediaInMemory: (memoryId: number, tag: string) => Promise<APIResponseInterface<IMemoryVisualMedia[]>>;
    createReelAnalysicBatch: (memoryId: number, tagName: string) => Promise<APIResponseInterface<boolean>>;
    updateReelAnalysicBatchStatus: (memoryId: number, tagName: string, status: "pending" | "completed" | "failed") => Promise<APIResponseInterface<boolean>>;
    createMemoriesRoom: (memoryId: number, name: string) => Promise<APIResponseInterface<boolean>>;
    saveMediaAnalysisResult: (mediaId: number, analysisResult: object) => Promise<APIResponseInterface<boolean>>;
    fetchBatchReelAnalysis: (memoryId: number) => Promise<APIResponseInterface<IMemoriesReelAnalysisBatch[]>>;
    fetchRoomChats: (roomId: number) => Promise<APIResponseInterface<IMemoriesChat[]>>;
    fetchAudioInMemory: (memoryId: number) => Promise<APIResponseInterface<IMemoryVisualMedia[]>>;
    createReelPipeLine: (reelCreationData: IMemoriesReelCreation) => Promise<APIResponseInterface<IReelPipelineResult>>;
}