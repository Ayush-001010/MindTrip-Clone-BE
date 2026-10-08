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
import MetaDataForBlog from "./Model/MetaDataForBlog";
import Blog from "./Model/Blog";
import BlogActivity from "./Model/BlogActivity";
import BlogTravel from "./Model/BlogTravel";
import BlogHotel from "./Model/BlogHotel";
import Collections from "./Model/Collections";
import FavouritesActivity from "./Model/FavouritesActivity";
import FavouritesHotel from "./Model/FavouritesHotel";
import FavouritesBlog from "./Model/FavouritesBlog";

export interface Models {
  ExploreTrip: typeof ExploreTrip;
  TripChat: typeof TripChat;
  Activities: typeof Activities;
  TripID: typeof TripID;
  TripDetails: typeof TripDetails;
  User: typeof User;
  UserTripMappingTable: typeof UserTripMappingTable;
  UserInvite: typeof UserInvite;
  TripExpense: typeof TripExpense;
  TripExpenseShare: typeof TripExpenseShare;
  TripSettlement: typeof TripSettlement;
  MetaDataForBlog: typeof MetaDataForBlog;
  Blog: typeof Blog;
  BlogActivity: typeof BlogActivity;
  BlogTravel: typeof BlogTravel;
  BlogHotel: typeof BlogHotel;
  Collections: typeof Collections;
  FavouritesActivity: typeof FavouritesActivity;
  FavouritesHotel: typeof FavouritesHotel;
  FavouritesBlog: typeof FavouritesBlog;
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
  MetaDataForBlog,
  Blog,
  BlogActivity,
  BlogTravel,
  BlogHotel,
  TripSettlement,
  Collections,
  FavouritesActivity,
  FavouritesHotel,
  FavouritesBlog,
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

Blog.hasMany(BlogActivity, {
  foreignKey: "blogId",
});

BlogActivity.belongsTo(Blog, {
  foreignKey: "blogId",
});

Blog.hasMany(BlogTravel, {
  foreignKey: "blogId",
});

BlogTravel.belongsTo(Blog, {
  foreignKey: "blogId",
});

Blog.hasMany(BlogHotel, {
  foreignKey: "blogId",
});

BlogHotel.belongsTo(Blog, {
  foreignKey: "blogId",
});

Collections.hasMany(FavouritesActivity, {
  foreignKey: "collectionId",
});

FavouritesActivity.belongsTo(Collections, {
  foreignKey: "collectionId",
});

Collections.hasMany(FavouritesHotel, {
  foreignKey: "collectionId",
});

FavouritesHotel.belongsTo(Collections, {
  foreignKey: "collectionId",
});

Collections.hasMany(FavouritesBlog, {
  foreignKey: "collectionId",
});

FavouritesBlog.belongsTo(Collections, {
  foreignKey: "collectionId",
});

export default models;
