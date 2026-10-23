import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IExploreTrip from "../DataInterface/IExploreTrip";
import ITripDetails from "../DataInterface/ITripDetails";
import IFinalItinerary from "../DataInterface/IFinalItinerary";
import IImportantDateResponse from "../DataInterface/IImportantDateResponse";
import ITripHotelData from "../DataInterface/ITripHotelData";
import { IMessage } from "./IGroupHub";

export default interface ITripInterface {
  exploreTrip(pageNo: number,): Promise<APIResponseInterface<IExploreTrip[] | null>>;
  createNewTrip: (userID: string) => Promise<APIResponseInterface<{url: string}>>;
  fetchTripIDs: (userID: string) => Promise<APIResponseInterface<Array<{tripID: string,name: string}> | null>>;
  fetchTripDetails(tripID: string): Promise<APIResponseInterface<ITripDetails | null>>;
  fetchTripMemberDetails(tripID: string): Promise<APIResponseInterface<Array<{userId: string,userName: string,userEmail: string}> | null>>;
  createUserInvite(tripID: string,inviteUserBy: string): Promise<APIResponseInterface<{url: string}>>;
  fetchFinalItinerary(tripID: string): Promise<APIResponseInterface<(ITripDetails & { countUserOnTrip: number }) | null>>;
  setTripStartAndEnd(base62: string,startDate: string,endDate: string): Promise<APIResponseInterface<null>>;
  setTripBudget(base62: string,budget: number): Promise<APIResponseInterface<null>>;
  validateUserInvite(base62: string): Promise<APIResponseInterface<{ tripID: string } | null>>;
  joinTrip(tripID: string, userID: number): Promise<APIResponseInterface<null>>;
  createFinalItinerary : (tripID:string , tripName:string , itinerary:any) => Promise<null>;
  searchImportantDates : (userID : string) => Promise<APIResponseInterface<IImportantDateResponse[]>>;
  editTripName: (tripID : string, newTripName: string) => Promise<APIResponseInterface<boolean>>;
  createTripHotel : (tripHotelData: ITripHotelData , type : "booked" | "wishlist") => Promise<APIResponseInterface<"booked" | "wishlist">>;
  fetchTripHotelDetails : (base62: string) => Promise<APIResponseInterface<ITripHotelData[] | null>>;
  likeOrDislikeTripHotel: (base62: string , id : number, action: "like" | "dislike") => Promise<APIResponseInterface<null>>;
  commentOnTripHotel: (base62: string , id : number, comment: string ) => Promise<APIResponseInterface<null>>;
  isUserTripAdmin : (base62:string , userID : string) => Promise<APIResponseInterface<boolean>>;
  fetchOldMessages: (base62: string) => Promise<APIResponseInterface<IMessage[]>>;
}
