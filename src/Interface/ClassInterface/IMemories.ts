import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IMemoriesData from "../DataInterface/IMemoriesData";

export interface IMemoriesReadOpt {
    fetchMemory: (userId : number) => Promise<APIResponseInterface<IMemoriesData[]>>;
}

export interface IMemoriesCreateOpt {
    createNewMemory: (userId : number , name : string) => Promise<APIResponseInterface<boolean>>;
}



export default interface IMemories {
    fetchMemory: (userId : number) => Promise<APIResponseInterface<IMemoriesData[]>>;
    createNewMemory: (userId : number , name : string) => Promise<APIResponseInterface<boolean>>;
}