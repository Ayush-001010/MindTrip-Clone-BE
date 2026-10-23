import IGroupHub, { IGroupCreationOpt, IMessage, INewMessageResponse } from "../../Interface/ClassInterface/IGroupHub";
import CreationOpt from "./Opt/CreationOpt";
import ReadOpt from "./Opt/ReadOpt";
import { IGroupHubReadOpt } from "../../Interface/ClassInterface/IGroupHub";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";

export default class GroupHub  implements IGroupHub {
    createOpt : IGroupCreationOpt;
    readOpt : IGroupHubReadOpt;

    constructor() {
        this.createOpt = new CreationOpt();
        this.readOpt = new ReadOpt();
    }

    newMessage = async (userID : string , userName : string , message : IMessage) : Promise<APIResponseInterface<INewMessageResponse>> => {
        const res = await this.createOpt.newMessage(userID, userName, message);
        if(res.data){
            return { success : true , data : {
                type : message.type,
                userName : userName,
                newMessage : {
                    type : message.type,
                    content : message.content,
                    base62: message.base62,
                    createdAt : new Date().toISOString()
                }
            }}
        } else {
            return { success: false }
        }
    }

    fetchOldMessages = async (base62: string) : Promise<APIResponseInterface<IMessage[]>> => {
        return await this.readOpt.fetchOldMessages(base62);
    }
}