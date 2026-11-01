import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IActivites from "../DataInterface/IActivites";
import IUserFollowing from "../DataInterface/IUserFollowing";
import IUserFriends from "../DataInterface/IUserFriends";
import IUserFollower from "../DataInterface/IUserFollower";

export default interface ICommonService {
    activites : (activityName : string) => Promise<APIResponseInterface<IActivites>>;
    convertBase62 : (tripID : string, options?: { isUUID?: boolean }) => string;
    uuidToBase62 : (uuid: string) => string;
    getPlaceImage:(placeName: string) => Promise<string>;
    checkIsFinalItineraryIsCreatedOrNot : (tripID: string) => Promise<boolean>;
    fetchUserDetails : (userID: number) => Promise<APIResponseInterface<any>>;
    fetchUserFollowing : (userID: number) => Promise<APIResponseInterface<IUserFollowing[]>>;
    fetchUserFriends : (userID: number) => Promise<APIResponseInterface<IUserFriends[]>>;
    fetchUserFollowers : (userID: number) => Promise<APIResponseInterface<IUserFollower[]>>;
    updateUserDetails : (userID: number, data: any) => Promise<APIResponseInterface<boolean>>;
}