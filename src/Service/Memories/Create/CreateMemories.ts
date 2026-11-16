import {IMemoriesCreateOpt} from "../../../Interface/ClassInterface/IMemories";
import APIResponseInterface from "../../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../../Database/Database";
import { v4 as uuidv4 } from 'uuid';

export default class CreateMemories implements IMemoriesCreateOpt {
    private dbInstanse : DataBaseService;

    constructor() {
        this.dbInstanse = new DataBaseService();
    }

    createNewMemory = async (userId: number, name: string): Promise<APIResponseInterface<boolean>> => {
        try {
            const userDetailsResponse = await this.dbInstanse.fetchData<any>("User" , undefined , undefined , {
                id: userId
            },["totalNumberOfMemoriesLeft" , "name" , "memoriesMapping"]);

            if(!userDetailsResponse.dataSuccess || userDetailsResponse.data?.length === 0) {
                throw new Error("User not found");
            }

            const lastMemoryResponse = await this.dbInstanse.fetchData<any>("Memories", undefined, undefined, {
                userId: userId
            });

            const lastMemoryType = lastMemoryResponse.data.length === 0 ?  "" : lastMemoryResponse.data?.[0].uiType;
            const memoriesMapping = userDetailsResponse.data?.[0]?.memoriesMapping;

            const userName = userDetailsResponse.data?.[0]?.name;
            const totalNumberOfMemoriesLeft = userDetailsResponse.data?.[0]?.totalNumberOfMemoriesLeft;
            if (totalNumberOfMemoriesLeft <= 0) {
                return { success: false, data: false };
            }

            const res1 = await this.dbInstanse.createData<any>("Memories" , {
                userId: userId,
                name: name,
                createdBy: userName,
                uiType: lastMemoryType === "" ? parseInt((Math.random() * 10).toString()) % 2 === 0 ? "type1" : "type2" : lastMemoryType === "type1" ? "type2" : "type1",
                progress : 0,
                workId: uuidv4(),
            });

            if(!res1.dataSuccess) {
                throw new Error("Failed to create memory");
            }

            const res2 =await this.dbInstanse.updateData("User", {
                totalNumberOfMemoriesLeft: totalNumberOfMemoriesLeft - 1,
                memoriesMapping : memoriesMapping + "," + res1.data?.id
            }, {
                id: userId
            });

            if(!res2.dataSuccess) {
                throw new Error("Failed to update user");
            }

            return { success: true , data: true };
        } catch (error) {
            console.log("Error creating new memory:", error);
            return { success: false };
        }
    };

    inviteUser = async ( userName: string, workId: string, base62: string): Promise<APIResponseInterface<boolean>> => {
        try {
            const res = await this.dbInstanse.createData("MemoriesUserInvite", {
                userName: userName,
                workId: workId,
                base62: base62,
                actionTaken: false
            });

            if(!res.dataSuccess) {
                throw new Error("Failed to invite user");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error inviting user:", error);
            return { success: false, data: false };
        }
    };

    userAddedToMemory = async (userId: string, base62: string): Promise<APIResponseInterface<boolean>> => {
        try {
            const userDetails = await this.dbInstanse.fetchData<any>("User", undefined, undefined, {
                id: userId
            }, ["memoriesMapping", "totalNumberOfMemoriesLeft"]);
            const res = await this.dbInstanse.updateData("MemoriesUserInvite", {
                actionTaken: true
            }, {
                base62: base62
            });

            const memoryInviteDetails = await this.dbInstanse.fetchData<any>("MemoriesUserInvite", undefined , undefined , {
                base62: base62
            },["workId"]);
            const workId = memoryInviteDetails.data?.[0]?.workId;
            const memoriesDetails = await this.dbInstanse.fetchData<any>("Memories", undefined, undefined, {
                workId: workId
            }, ["id"]);

            const memoryId = memoriesDetails.data?.[0]?.dataValues?.id;
            
            const res3 = await this.dbInstanse.updateData("User", {
                memoriesMapping: userDetails.data?.[0]?.memoriesMapping + "," + memoryId,
                totalNumberOfMemoriesLeft: userDetails.data?.[0]?.totalNumberOfMemoriesLeft - 1
            }, {
                id: userId
            });

            if(!res.dataSuccess) {
                throw new Error("Failed to update user invite status");
            }
            if(!res3.dataSuccess) {
                throw new Error("Failed to update user memories mapping");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error updating user invite status:", error);
            return { success: false, data: false };
        }
    };

    changePlaceInMemory = async (placeName: string, id: number): Promise<APIResponseInterface<boolean>> => {
        try {
            const res = await this.dbInstanse.updateData("Memories", {
                "place": placeName
            }, {
                id: id
            });

            if(!res.dataSuccess) {
                throw new Error("Failed to change place in memory");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error changing place in memory:", error);
            return { success: false, data: false };
        }
    };

    addMediaToMemory = async (memoryId: number, type: "pic" | "video" | "audio", url: string, tag?: string): Promise<APIResponseInterface<boolean>> => {
        try {
            const res = await this.dbInstanse.createData("MemoriesPicAndAudio", {
                memoryId: memoryId,
                type: type,
                url: url,
                tag: tag
            });

            if(!res.dataSuccess) {
                throw new Error("Failed to add media to memory");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error adding media to memory:", error);
            return { success: false, data: false };
        }
    };

    addChatToMemory = async (memoryId: number, userMessage: string, actionType?: "Start" | "Other", userName?: string): Promise<APIResponseInterface<boolean>> => {
        try {
            const res = await this.dbInstanse.createData("MemoriesChats", {
                memoryId: memoryId,
                userMessage: userMessage,
                actionType: actionType || "Other",
                userName: userName || ""
            });

            if(!res.dataSuccess) {
                throw new Error("Failed to add chat to memory");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error adding chat to memory:", error);
            return { success: false, data: false };
        }
    };

    createReelAnalysicBatch = async (memoryId: number, tagName: string): Promise<APIResponseInterface<boolean>> => {
        try {
            const res = await this.dbInstanse.createData("ReelAnalysicBatch", {
                memoryId: memoryId,
                tagName: tagName,
                status: "pending"
            });

            if(!res.dataSuccess) {
                throw new Error("Failed to create reel analysic batch");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error creating reel analysic batch:", error);
            return { success: false, data: false };
        }
    };

    updateReelAnalysicBatchStatus = async (memoryId: number, tagName: string, status: "pending" | "completed" | "failed"): Promise<APIResponseInterface<boolean>> => {
        try {
            const res = await this.dbInstanse.updateData("ReelAnalysicBatch", { status }, { memoryId, tagName });

            if(!res.dataSuccess) {
                throw new Error("Failed to update reel analysic batch status");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error updating reel analysic batch status:", error);
            return { success: false, data: false };
        }
    };

    saveMediaAnalysisResult = async (mediaId: number, analysisResult: object): Promise<APIResponseInterface<boolean>> => {
        try {
            const res = await this.dbInstanse.updateData("MemoriesPicAndAudio", {
                analysisResult: JSON.stringify(analysisResult),
                isProcessed: true
            }, { id: mediaId });

            if(!res.dataSuccess) {
                throw new Error("Failed to save media analysis result");
            }

            return { success: true, data: true };
        } catch (error) {
            console.log("Error saving media analysis result:", error);
            return { success: false, data: false };
        }
    };
}