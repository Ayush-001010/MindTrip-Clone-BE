import Activities from "./Model/Activites";
import TripDetails from "./Model/TripDetails";
import ExploreTrip from "./Model/ExploreTrip";
import TripChat from "./Model/TripChat";
import TripID from "./Model/TripID";

export interface Models {
  ExploreTrip: typeof ExploreTrip;
  TripChat: typeof TripChat;
  Activities: typeof Activities;
  TripID: typeof TripID;
  TripDetails : typeof TripDetails;
}

const models: Models = {
  ExploreTrip,
  TripChat,
  Activities,
  TripID,
  TripDetails
};

export default models;
