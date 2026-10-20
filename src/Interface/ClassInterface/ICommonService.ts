import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IActivites from "../DataInterface/IActivites";

export default interface ICommonService {
    activites : (activityName : string) => Promise<APIResponseInterface<IActivites>>;
    convertBase62 : (tripID : string, options?: { isUUID?: boolean }) => string;
    uuidToBase62 : (uuid: string) => string;
    getPlaceImage:(placeName: string) => Promise<string>;
    checkIsFinalItineraryIsCreatedOrNot : (tripID: string) => Promise<boolean>;
    fetchUserDetails : (userID: number) => Promise<APIResponseInterface<any>>;
}