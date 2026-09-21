import Activities from "./Model/Activites";
import UserInvite from "./Model/UserInvite";
import TripExpense from "./Model/TripExpense";
import TripExpenseShare from "./Model/TripExpenseShare";
import TripSettlement from "./Model/TripSettlement";
import TripDetails from "./Model/TripDetails";
import ExploreTrip from "./Model/ExploreTrip";
import TripChat from "./Model/TripChat";
import TripID from "./Model/TripID";
import User from "./Model/User";
import UserTripMappingTable from "./Model/UserTripMappingTable";

export interface Models {
  ExploreTrip: typeof ExploreTrip;
  TripChat: typeof TripChat;
  Activities: typeof Activities;
  TripID: typeof TripID;
  TripDetails : typeof TripDetails;
  User : typeof User;
  UserTripMappingTable: typeof UserTripMappingTable;
  UserInvite: typeof UserInvite;
  TripExpense: typeof TripExpense;
  TripExpenseShare: typeof TripExpenseShare;
  TripSettlement: typeof TripSettlement;
}

const models: Models = {
  ExploreTrip,
  TripChat,
  Activities,
  TripID,
  TripDetails,
  User,
  UserTripMappingTable,
  UserInvite,
  TripExpense,
  TripExpenseShare,
  TripSettlement,
}; 

User.hasMany(UserTripMappingTable, {
  foreignKey: "userId",
});

UserTripMappingTable.belongsTo(User, {
  foreignKey: "userId",
});

TripID.hasMany(UserTripMappingTable, {
  foreignKey: "tripDetailsId",
});

UserTripMappingTable.belongsTo(TripID, {
  foreignKey: "tripDetailsId",
});

export default models;
