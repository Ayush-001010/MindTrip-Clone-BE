import {IMemoriesReadOpt} from "../../../Interface/ClassInterface/IMemories";
import APIResponseInterface from "../../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../../Database/Database";
import IMemoriesData from "../../../Interface/DataInterface/IMemoriesData";

export default class ReadMemories implements IMemoriesReadOpt {
    private dbInstanse : DataBaseService;

    constructor() {
        this.dbInstanse = new DataBaseService();
    }
    
    fetchMemory = async (userId: number): Promise<APIResponseInterface<IMemoriesData[]>>  => {
        try {
            const memoriesResponse = await this.dbInstanse.fetchData<any>("Memories", undefined, undefined, {
                userId: userId
            });
            return { success: true, data: memoriesResponse.data.map((item : any) => ({
                id: item.dataValues.id,
                name: item.dataValues.name,
                createdBy: item.dataValues.createdBy,
                totalCreditLeft : item.dataValues.totalCreditLeft,
                numberOfPeopleWorkingCurrently : item.dataValues.numberOfPeopleWorkingCurrently,
                progress: item.dataValues.progress,
                uiType: item.dataValues.uiType,
                userDetails: [], // It's pending currently
                place: item.dataValues.place,
            })) };
        } catch (error) {
            console.log("Error fetching memories:", error);
            return { success: false, data: [] };
        }
    }
}