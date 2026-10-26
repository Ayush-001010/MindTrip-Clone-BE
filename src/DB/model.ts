import Activities from "./Model/Activites";
import UserFriends from "./Model/UserFriends";
import UserFollowing from "./Model/UserFollowing";
import CheckIns from "./Model/CheckIns";
import PollOption from "./Model/PollOption";
import Opinion from "./Model/Opinion";
import TripHotel from "./Model/TripHotel";
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
import GroupPost from "./Model/GroupPost";
import OpinionComment from "./Model/OpinionComment";

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
  TripHotel : typeof TripHotel;
  GroupPost: typeof GroupPost;
  Opinion: typeof Opinion;
  OpinionComment: typeof OpinionComment;
  PollOption: typeof PollOption;
  CheckIns: typeof CheckIns;
  UserFollowing : typeof UserFollowing;
  UserFriends: typeof UserFriends;
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
  TripHotel,
  GroupPost,
  Opinion,
  OpinionComment,
  PollOption,
  CheckIns,
  UserFollowing,
  UserFriends
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

Opinion.hasMany(OpinionComment, {
  foreignKey: "opinionId",
});

OpinionComment.belongsTo(Opinion, {
  foreignKey: "opinionId",
});

GroupPost.hasMany(PollOption, {
  foreignKey: "groupPostId",
});

PollOption.belongsTo(GroupPost, {
  foreignKey: "groupPostId",
});

GroupPost.hasMany(Opinion, {
  foreignKey: "groupPostId",
});

Opinion.belongsTo(GroupPost, {
  foreignKey: "groupPostId",
});

CheckIns.belongsTo(GroupPost, {
  foreignKey: "groupPostId",
});

GroupPost.hasMany(CheckIns, {
  foreignKey: "groupPostId",
});

export default models;
