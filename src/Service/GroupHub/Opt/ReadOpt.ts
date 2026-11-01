import {IGroupHubReadOpt, IMessage} from "../../../Interface/ClassInterface/IGroupHub";
import APIResponseInterface from "../../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../../Database/Database";

export default class ReadOpt implements IGroupHubReadOpt {
    private dbInstance : DataBaseService;
    
    constructor() {
        this.dbInstance = new DataBaseService();
    }

    fetchOldMessages = async (base62: string): Promise<APIResponseInterface<IMessage[]>> => {
        try{
            const dbResponse = await this.dbInstance.fetchData<any>("GroupPost",undefined,undefined,{
                base62: base62
            });
            const message : IMessage[] = dbResponse.data.map((item: any) => {
                const data = item.dataValues;
                return {
                    type: data.type,
                    content: data.content,
                    base62: base62,
                    createdAt: data.createdAt,
                    id: data.id
                };
            });

            // Fetch poll options if the message type is "poll"
            await Promise.all(message.map(async (msg) => {
                if(msg.type === "poll"){
                    const pollOptions = await this.dbInstance.fetchData<any>("PollOption", undefined, undefined, {
                        groupPostId: msg.id
                    });
                    msg.options = pollOptions.data.map((option: any) => option.dataValues);
                } else if(msg.type === "opinion"){
                    const opinionData = await this.dbInstance.fetchData<any>("Opinion", undefined, undefined, {
                        groupPostId: msg.id
                    });
                    if(opinionData && opinionData.data && opinionData.data.length > 0){
                        msg.imageUrl = opinionData.data[0].dataValues.imageUrl;
                    }

                    const commentsData = await this.dbInstance.fetchData<any>("OpinionComment", undefined, undefined, {
                        opinionId: opinionData.data[0].dataValues.id
                    });
                    msg.comments = commentsData.data.map((comment: any) => comment.dataValues);
                } else if(msg.type === "check-ins"){
                    const checkInData = await this.dbInstance.fetchData<any>("CheckIns", undefined, undefined, {
                        groupPostId: msg.id
                    });
                    if(checkInData && checkInData.data && checkInData.data.length > 0){
                        msg.checkIn = checkInData.data.map((checkIn: any) => ({
                            id: checkIn.dataValues.id,
                            userMember: checkIn.dataValues.userMember,
                            status: checkIn.dataValues.status,
                            reachWhen: checkIn.dataValues.ReachWhen,
                            createdAt: checkIn.dataValues.createdAt
                        }));
                    }
                }
            }));
            return { success: true, data: message };
        } catch (error) {
            return { success: false};
        }
    }
}