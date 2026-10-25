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
            const createResponse = await this.dbInstance.createData<any>("GroupPost", addObj);
            const id = createResponse?.data.id;
            if(message.type === "poll" && message.options && message.options.length > 0){
                const tripDetails = await this.dbInstance.fetchData<any>("TripID", undefined, undefined, {
                    base62: message.base62
                });
                const id = tripDetails?.data[0]?.dataValues?.id;
                const userOnTrip = await this.dbInstance.fetchData<any>("UserTripMappingTable", undefined, undefined, {
                    tripDetailsId: id,
                });
                await Promise.all(message.options.map( async option => {
                    const optionsObj = {
                        "groupPostId" : id,
                        "content" : option,
                        "disLikeCount" : userOnTrip.data.length
                    };
                    return await this.dbInstance.createData("PollOption", optionsObj);
                }));
            } else if(message.type === "opinion" && message.imageUrl){
                const opinionObj = {
                    "groupPostId" : id,
                    "imageUrl" : message.imageUrl
                };
                await this.dbInstance.createData("Opinion", opinionObj);
            }
            return { success : true , data : true };
        } catch (error) {
            console.log("Error in newMessage:", error);
            return { success : false  , data : false};
        }
    }
    
    likeOrDislikePollOption = async (optionID: number, like: boolean): Promise<APIResponseInterface<boolean>> => {
        try{
            const data = await this.dbInstance.fetchData<any>("PollOption", undefined, undefined, {
                id: optionID
            });
            if(data && data.data && data.data.length > 0){
                const option = data.data[0].dataValues;
                option.likeCount = option.likeCount || 0;
                option.disLikeCount = option.disLikeCount || 0;
                if(like){
                    option.likeCount += 1;
                    option.disLikeCount -= 1;
                } else {
                    option.disLikeCount += 1;
                    option.likeCount -= 1;
                }
                await this.dbInstance.updateData("PollOption", { likeCount: option.likeCount, disLikeCount: option.disLikeCount }, { id: optionID });
                return { success: true, data: true };
            } else {
                return { success: false, data: false };
            }
        } catch (error) {
            console.log("Error in likeOrDislikePollOption:", error);
            return { success: false, data: false };
        }
    }

    addCommentOnOpinion = async (postId : number , comment : string , userName : string , parentOpinionCommentId?: number): Promise<APIResponseInterface<boolean>> => {
        try{
            const opinionData = await this.dbInstance.fetchData<any>("Opinion", undefined, undefined, {
                groupPostId: postId
            });
            if(!opinionData || !opinionData.data || opinionData.data.length === 0){
                return { success: false, data: false };
            }
            const opinionId = opinionData.data[0].dataValues.id;

            const commentObj = {
                "opinionId" : opinionId,
                "comment" : comment,
                "userName" : userName,
                "parentCommentId" : parentOpinionCommentId || null
            };
            await this.dbInstance.createData("OpinionComment", commentObj);
            return { success: true, data: true };
        } catch (error) {
            console.log("Error in addCommentOnOpinion:", error);
            return { success: false, data: false };
        }
    }
}