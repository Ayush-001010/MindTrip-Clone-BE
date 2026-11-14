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
                workId: item.dataValues.workId
            })) };
        } catch (error) {
            console.log("Error fetching memories:", error);
            return { success: false, data: [] };
        }
    }

    fetchParticularMemoryDetails = async (workId: string): Promise<APIResponseInterface<IMemoriesData>> => {
        try {
            const memoryResponse = await this.dbInstanse.fetchData<any>("Memories", undefined, undefined, {
                workId: workId
            });
            if (memoryResponse.data.length === 0) {
                return { success: false, data: {} as IMemoriesData };
            }
            const item = memoryResponse.data[0].dataValues;
            return {
                success: true,
                data: {
                    id: item.id,
                    name: item.name,
                    createdBy: item.createdBy,
                    totalCreditLeft: item.totalCreditLeft,
                    numberOfPeopleWorkingCurrently: item.numberOfPeopleWorkingCurrently,
                    progress: item.progress,
                    uiType: item.uiType,
                    userDetails: [], // It's pending currently
                    place: item.place,
                    workId: item.workId
                }
            };
        } catch (error) {
            console.log("Error fetching particular memory details:", error);
            return { success: false, data: {} as IMemoriesData };
        }
    }

    fetchParticularMemoryDetailsForInvite = async (base62: string): Promise<APIResponseInterface<IMemoriesData>> => {
        try {
            const response = await this.dbInstanse.fetchData<any>("MemoriesUserInvite",undefined,undefined,{
                base62: base62
            },["workId","actionTaken"]);
            if(response.data.length === 0 || !response.dataSuccess) {
                return { success: false, data: {} as IMemoriesData };
            }
            const workId = response.data[0].dataValues.workId;
            const actionTaken = response.data[0].dataValues.actionTaken;
            if(actionTaken) {
                return { success: false, data: {} as IMemoriesData };
            }

            const memoryDetails = await this.fetchParticularMemoryDetails(workId);
            return memoryDetails;
        } catch(error){
            console.log("Error fetching particular memory details for invite:", error);
            return { success: false, data: {} as IMemoriesData };
        }
    }
}