import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IExploreTrip from "../DataInterface/IExploreTrip";
import ITripDetails from "../DataInterface/ITripDetails";

export default interface ITripInterface {
  exploreTrip(pageNo: number): Promise<APIResponseInterface<IExploreTrip[] | null>>;
  createNewTrip : (userID : string) => Promise<APIResponseInterface<{
        "url" : string;
  }>>;
  fetchTripDetails(tripID: string): Promise<APIResponseInterface<ITripDetails|null>>;
}
