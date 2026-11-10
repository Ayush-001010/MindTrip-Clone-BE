import IMemories, { IMemoriesCreateOpt, IMemoriesReadOpt } from "../../Interface/ClassInterface/IMemories";
import IMemoriesData from "../../Interface/DataInterface/IMemoriesData";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CreateMemories from "./Create/CreateMemories";
import ReadMemories from "./Read/ReadMemories";

export default class Memories implements IMemories {
    createOpt : IMemoriesCreateOpt;
    readOpt : IMemoriesReadOpt;

    constructor() {
        this.createOpt = new CreateMemories();
        this.readOpt = new ReadMemories();
    }


    fetchMemory(userId: number): Promise<APIResponseInterface<IMemoriesData[]>> {
        return this.readOpt.fetchMemory(userId);
    }

    createNewMemory(userId: number, name: string): Promise<APIResponseInterface<boolean>> {
        return this.createOpt.createNewMemory(userId, name);
    }
}