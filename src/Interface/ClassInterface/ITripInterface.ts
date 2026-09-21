import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IExploreTrip from "../DataInterface/IExploreTrip";
import ITripDetails from "../DataInterface/ITripDetails";
import IFinalItinerary from "../DataInterface/IFinalItinerary";

export default interface ITripInterface {
  exploreTrip(pageNo: number): Promise<APIResponseInterface<IExploreTrip[] | null>>;
  createNewTrip : (userID : string) => Promise<APIResponseInterface<{
        "url" : string;
  }>>;
  fetchTripDetails(tripID: string): Promise<APIResponseInterface<ITripDetails|null>>;
  fetchTripMemberDetails(tripID: string): Promise<APIResponseInterface<Array<{
    "userId": string;
    "userName": string;
    "userEmail": string;
  }>|null>>;
  createUserInvite(tripID: string, inviteUserBy: string): Promise<APIResponseInterface<{
    "url" : string;
  }>>;
  fetchFinalItinerary(tripID: string): Promise<APIResponseInterface<ITripDetails & { countUserOnTrip: number }|null>>;
  setTripStartAndEnd(base62: string, startDate: string, endDate: string): Promise<APIResponseInterface<null>>;
  setTripBudget(base62: string, budget: number): Promise<APIResponseInterface<null>>;
}
