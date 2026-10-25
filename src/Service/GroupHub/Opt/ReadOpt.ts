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
                }
            }));
            return { success: true, data: message };
        } catch (error) {
            return { success: false};
        }
    }
}