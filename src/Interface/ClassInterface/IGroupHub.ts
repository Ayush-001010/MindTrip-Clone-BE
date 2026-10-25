import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export interface IMessage {
    type : "announcement" | "medical-emergency" | "poll" | "opinion";
    content : string;
    base62: string;
    createdAt?: string;
    options?: string[];
    id?: number;
    imageUrl?: string;
    comments?: any[];
}

export interface INewMessageResponse {
    type : "announcement" | "medical-emergency" | "poll" | "opinion";
    userName : string;
    newMessage : {
        type : "announcement" | "medical-emergency" | "poll" | "opinion";
        content : string;
        base62: string;
        createdAt : string;
        options?: string[];
        imageUrl?: string;
    }
}

export interface IGroupCreationOpt {
    newMessage : (userID : string , userName : string , message : IMessage) => Promise<APIResponseInterface<boolean>>;
    likeOrDislikePollOption : (optionID: number, like: boolean) => Promise<APIResponseInterface<boolean>>;
    addCommentOnOpinion : (postId : number , comment : string , userName : string , parentOpinionCommentId?: number) => Promise<APIResponseInterface<boolean>>;
}

export interface IGroupHubReadOpt {
    fetchOldMessages : (base62: string) => Promise<APIResponseInterface<IMessage[]>>;
}

export default interface IGroupHub {
    newMessage : (userID : string , userName : string , message : IMessage) => Promise<APIResponseInterface<INewMessageResponse>>;
    fetchOldMessages : (base62: string) => Promise<APIResponseInterface<IMessage[]>>;
    likeOrDislikePollOption : (optionID: number, like: boolean) => Promise<APIResponseInterface<boolean>>;
    addCommentOnOpinion : (postId : number , comment : string , userName : string , parentOpinionCommentId?: number) => Promise<APIResponseInterface<boolean>>;
}