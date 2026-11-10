import {IMemoriesCreateOpt} from "../../../Interface/ClassInterface/IMemories";
import APIResponseInterface from "../../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../../Database/Database";

export default class CreateMemories implements IMemoriesCreateOpt {
    private dbInstanse : DataBaseService;

    constructor() {
        this.dbInstanse = new DataBaseService();
    }

    createNewMemory = async (userId: number, name: string): Promise<APIResponseInterface<boolean>> => {
        try {
            const userDetailsResponse = await this.dbInstanse.fetchData<any>("User" , undefined , undefined , {
                id: userId
            });

            const lastMemoryResponse = await this.dbInstanse.fetchData<any>("Memories", undefined, undefined, {
                userId: userId
            });

            const lastMemoryType = lastMemoryResponse.data.length === 0 ?  "" : lastMemoryResponse.data?.[0].uiType;

            const userName = userDetailsResponse.data?.[0]?.name;

            await this.dbInstanse.createData("Memories" , {
                userId: userId,
                name: name,
                createdBy: userName,
                uiType: lastMemoryType === "" ? (Math.random() * 10) % 2 === 0 ? "type1" : "type2" : lastMemoryType === "type1" ? "type2" : "type1",
                progress : 0,
            });

            return { success: true , data: true };
        } catch (error) {
            console.log("Error creating new memory:", error);
            return { success: false };
        }
    }
}