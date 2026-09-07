import Activities from "./Model/Activites";
import ExploreTrip from "./Model/ExploreTrip";
import TripChat from "./Model/TripChat";

export interface Models {
  ExploreTrip: typeof ExploreTrip;
  TripChat: typeof TripChat;
  Activities: typeof Activities;
}

const models: Models = {
  ExploreTrip,
  TripChat,
  Activities,
};

export default models;
