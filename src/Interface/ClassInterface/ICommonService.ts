import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IActivites from "../DataInterface/IActivites";

export default interface ICommonService {
    activites : (activityName : string) => Promise<APIResponseInterface<IActivites>>;
}