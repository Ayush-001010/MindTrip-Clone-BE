import {IMemoriesReadOpt, IMemoriesReelAnalysisBatch, IMemoryVisualMedia} from "../../../Interface/ClassInterface/IMemories";
import APIResponseInterface from "../../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../../Database/Database";
import IMemoriesData from "../../../Interface/DataInterface/IMemoriesData";
import IMemoriesChat from "../../../Interface/DataInterface/IMemoriesChat";

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
            const res1 = await this.dbInstanse.fetchData<any>("MemoriesPicAndAudio" , 1 , undefined, {
                memoryId: item.id,
                type:"audio"
            });
            const isTripAudioUpload = res1.data.length > 0; 
            const res2 = await this.dbInstanse.fetchData<any>("MemoriesPicAndAudio" , 1 , undefined, {
                memoryId: item.id,
                type:"pic"
            });
            const res3 = await this.dbInstanse.fetchData<any>("MemoriesPicAndAudio" , 1 , undefined, {
                memoryId: item.id,
                type:"video"
            });
            const isTripPhotoAndVideoUpload = res2.data.length > 0 || res3.data.length > 0; 
            const res4 = await this.dbInstanse.fetchData<any>("MemoriesRoom", undefined, undefined, {
                memoryId: item.id
            });
            // const rooms = res4.data.map((room: any) => ({ name: room.dataValues.name, id: room.dataValues.id }));
            await Promise.all(res4.data.map(async (room: any) => {
                const resScript = await this.dbInstanse.fetchData<any>("MemoriesChats", 1, undefined, {
                    roomId: room.dataValues.id
                });
                console.log("Fetched script for room:", resScript);
                room.dataValues.script = resScript.data.length > 0 ? JSON.parse(resScript.data[0].dataValues.botMessage) : undefined;
            }));
            const rooms = res4.data.map((room: any) => ({ name: room.dataValues.name, id: room.dataValues.id, script: room.dataValues.script }));
            const res5 = await this.dbInstanse.fetchData<any>("ReelAnalysicBatch", undefined, undefined, {
                memoryId: item.id
            });
            const isAllAnalysisCompleted = res5.data.every((batch: any) => batch.dataValues.status === "completed");
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
                    workId: item.workId,
                    isTripPhotoAndVideoUpload: isTripPhotoAndVideoUpload,
                    isTripAudioUpload: isTripAudioUpload,
                    rooms: rooms,
                    isAllAnalysisCompleted: isAllAnalysisCompleted
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

    fetchPlaceInMemory = async (id:number): Promise<APIResponseInterface<string[]>> => {
        const response = await this.dbInstanse.fetchData<any>("Memories", undefined, undefined, {
            id: id
        },["place"]);
        if(!response.dataSuccess || response.data.length === 0) {
            return { success: false, data: [] };
        }
        const placeInMemory = response.data[0].dataValues.place.split("|");
        return { success: true, data: placeInMemory };
    }

    fetchVisualMediaInMemory = async (memoryId: number, tag: string): Promise<APIResponseInterface<IMemoryVisualMedia[]>> => {
        const response = await this.dbInstanse.fetchData<any>("MemoriesPicAndAudio", undefined, undefined, {
            memoryId: memoryId,
            type: ["pic", "video"],
            tag: tag
        }, [["id", "ASC"]], ["id", "type", "tag" , "url" , "isProcessed", "analysisResult"]);
        if (!response.dataSuccess || !response.data) {
            return { success: false, data: [] };
        }
        return {
            success: true,
            data: response.data.map((item: any) => ({
                id: item.dataValues.id,
                type: item.dataValues.type,
                tag: item.dataValues.tag,
                url: item.dataValues.url,
                isProcessed: item.dataValues.isProcessed,
                analysisResult: item.dataValues.analysisResult
            })),
        };
    }

    fetchBatchReelAnalysis = async (memoryId: number): Promise<APIResponseInterface<IMemoriesReelAnalysisBatch[]>> => {
        const response = await this.dbInstanse.fetchData<any>("ReelAnalysicBatch", undefined, undefined, {
            memoryId: memoryId
        }, [["id", "ASC"]], ["tagName", "status"]);
        if (!response.dataSuccess || !response.data) {
            return { success: false, data: [] };
        }
        return {
            success: true,
            data: response.data.map((item: any) => ({
                tagName: item.dataValues.tagName,
                status: item.dataValues.status
            })),
        };
    }

    fetchRoomChats = async (roomId: number): Promise<APIResponseInterface<IMemoriesChat[]>> => {
        const response = await this.dbInstanse.fetchData<any>("MemoriesChats", undefined, undefined, {
            roomId: roomId,
        }, [["id", "ASC"]]);
        if (!response.dataSuccess || !response.data) {
            return { success: false, data: [] };
        }
        return {
            success: true,
            data: response.data.map((item: any) => ({
                id: item.dataValues.id,
                roomId: item.dataValues.roomId,
                memoryId: item.dataValues.memoryId,
                userMessage: item.dataValues.userMessage,
                botMessage: item.dataValues.botMessage,
                userName: item.dataValues.userName,
                actionType: item.dataValues.actionType,
                createdAt: item.dataValues.createdAt,
                updatedAt: item.dataValues.updatedAt,
            })),
        };
    }

    fetchAudioInMemory = async (memoryId: number): Promise<APIResponseInterface<IMemoryVisualMedia[]>> => {
        const response = await this.dbInstanse.fetchData<any>("MemoriesPicAndAudio", undefined, undefined, {
            memoryId: memoryId,
            type: ["audio"]
        }, [["id", "ASC"]], ["id", "type", "tag" , "url" , "isProcessed", "analysisResult"]);
        if (!response.dataSuccess || !response.data) {
            return { success: false, data: [] };
        }
        return {
            success: true,
            data: response.data.map((item: any) => ({
                id: item.dataValues.id,
                type: item.dataValues.type,
                tag: item.dataValues.tag,
                url: item.dataValues.url,
                isProcessed: item.dataValues.isProcessed,
                analysisResult: item.dataValues.analysisResult
            })),
        };
    }
}