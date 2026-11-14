import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IMemoriesData from "../DataInterface/IMemoriesData";
import { ICharacterAnalysisResult, MascotColorMode } from "../DataInterface/ICharacterSpecification";

export interface IMemoriesReadOpt {
    fetchMemory: (userId : number) => Promise<APIResponseInterface<IMemoriesData[]>>;
    fetchParticularMemoryDetails: (workId : string) => Promise<APIResponseInterface<IMemoriesData>>;
    fetchParticularMemoryDetailsForInvite : (base62 : string) => Promise<APIResponseInterface<IMemoriesData>>;
}

export interface IMemoriesCreateOpt {
    createNewMemory: (userId : number , name : string) => Promise<APIResponseInterface<boolean>>;
    inviteUser: (userName: string, workId: string, base62: string) => Promise<APIResponseInterface<boolean>>;
    userAddedToMemory:(userId : string , base62 : string) => Promise<APIResponseInterface<boolean>>;
}

export interface IMemoriesAgent {
    convertImageToCartoon: (filePath: string, colorMode?: MascotColorMode) => Promise<APIResponseInterface<ICharacterAnalysisResult>>;
}

export default interface IMemories {
    fetchMemory: (userId : number) => Promise<APIResponseInterface<IMemoriesData[]>>;
    createNewMemory: (userId : number , name : string) => Promise<APIResponseInterface<boolean>>;
    inviteUser: (userName: string, workId: string, base62: string) => Promise<APIResponseInterface<boolean>>;
    fetchParticularMemoryDetails: (workId : string) => Promise<APIResponseInterface<IMemoriesData>>;
    fetchParticularMemoryDetailsForInvite: (base62 : string) => Promise<APIResponseInterface<IMemoriesData>>;
    userAddedToMemory:(userId : string , base62 : string) => Promise<APIResponseInterface<boolean>>;
    convertImageToCartoon: (filePath: string, colorMode?: MascotColorMode) => Promise<APIResponseInterface<ICharacterAnalysisResult>>;
}