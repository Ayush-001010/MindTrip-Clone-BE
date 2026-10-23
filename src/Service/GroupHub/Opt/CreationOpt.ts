import  {IGroupCreationOpt , IMessage } from "../../../Interface/ClassInterface/IGroupHub";
import APIResponseInterface from "../../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../../Database/Database";

export default class CreationOpt  implements IGroupCreationOpt {
    private dbInstance : DataBaseService;

    constructor() {
        this.dbInstance = new DataBaseService();
    }

    newMessage = async (userID : string , userName : string , message : IMessage) :  Promise<APIResponseInterface<boolean>> => {
        try {
            const addObj = {
                "base62" : message.base62,
                "authorUserId" : userID,
                "authorUserName" : userName,
                "type" : message.type,
                "content" : message.content
            };
            await this.dbInstance.createData("GroupPost", addObj);
            return { success : true , data : true };
        } catch (error) {
            console.log("Error in newMessage:", error);
            return { success : false  , data : false};
        }
    }
    
}