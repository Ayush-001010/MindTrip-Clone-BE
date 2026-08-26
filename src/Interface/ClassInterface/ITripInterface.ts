import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IExploreTrip from "../DataInterface/IExploreTrip";

export default interface ITripInterface {
  exploreTrip(pageNo: number): Promise<APIResponseInterface<IExploreTrip[] | null>>;
}
