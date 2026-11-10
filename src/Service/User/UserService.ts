import IUserService, { ISearchUserProfileResult } from "../../Interface/ClassInterface/IUserService";
import IImportantDateRange from "../../Interface/DataInterface/IImportantDateRange";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../Database/Database";
import FuzzySearch from 'fuzzy-search';
import { IUserFriend } from "../../Interface/ClassInterface/IUserService";

export default class UserService implements IUserService {
  private dataBaseServiceInstance: DataBaseService;

  constructor() {
    this.dataBaseServiceInstance = new DataBaseService();
  }

  async fetchImportantDates(userID: string): Promise<{dateRange : IImportantDateRange[] , birthdayDate: Date | null, anniversaryDate: Date | null} | null> {
    try {
      const userDetails = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: userID,
        },
      );
      if (userDetails.dataSuccess && userDetails.data) {
        const holidayDate = (userDetails.data?.[0]?.holidayDate || "").split(
          "|",
        );
        // console.log("Holiday Dates: ", holidayDate);
        const birthDate = (userDetails.data?.[0]?.birthdayDate ||
          null) as String | null;
        console.log("Birthday Date: ", birthDate);
        const anniversaryDate = (userDetails.data?.[0]?.anniversaryDate ||
          null) as String | null;
        // console.log("Anniversary Date: ", anniversaryDate);
        const dateRange: IImportantDateRange[] = [];
        holidayDate.forEach((date: string) => {
          const [day, month] = date.split("-").map(Number);
          if (!isNaN(day) && !isNaN(month)) {
            dateRange.push({ day, month });
          }
        });
        console.log("Date Range: ", dateRange);
        return { dateRange, birthdayDate: birthDate ? new Date((new Date()).getFullYear(), birthDate.split("-").map(Number)[1] - 1, birthDate.split("-").map(Number)[2], 10, 0, 0) : null, anniversaryDate : anniversaryDate ? new Date((new Date()).getFullYear(), anniversaryDate.split("-").map(Number)[1] - 1, anniversaryDate.split("-").map(Number)[2], 10, 0, 0) : null };
      } else {
        throw new Error("FAILED_TO_FETCH_USER_DETAILS");
      }
    } catch (error) {
      console.error("Error fetching important dates: ", error);
      return null;
    }
  }
  
  async fetchUserDetails(userID: string): Promise<{name: string, email: string} | null> {
    try {
      const userDetails = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: userID,
        },
      );
      if (userDetails.dataSuccess && userDetails.data) {
        const name = userDetails.data?.[0]?.dataValues.name || "";
        const email = userDetails.data?.[0]?.dataValues.email || "";
        return { name, email };
      } else {
        throw new Error("FAILED_TO_FETCH_USER_DETAILS");
      }
    } catch (error) {
      console.error("Error fetching user details: ", error);
      return null;
    }
  }

  async followUser(userID: string, followingUserID: string): Promise<APIResponseInterface<boolean>> {
    try{
      const userDetailsFollower = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: userID,
        },
      );
      const userDetailsFollowing = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: followingUserID,
        },
      );
      const response = await this.dataBaseServiceInstance.createData<any>("UserFollowing",{
        userId: userID,
        followingUserId: followingUserID,
        userName : userDetailsFollower.data?.[0]?.dataValues.name || "",
        followingUserName : userDetailsFollowing.data?.[0]?.dataValues.name || "",
      });
      if(response.dataSuccess){
        return { success: true, data: true };
      } else {
        return { success: false, data: false };
      }
    } catch (error) {
      console.error("Error following user: ", error);
      return { success: false, data: false };
    }
  }

  async likeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>> {
    try {
      const response = await this.dataBaseServiceInstance.createData<any>("BlogLikeByUser", {
        userId: userID,
        blogId: blogID,
      });
      if (response.dataSuccess) {
        return { success: true, data: true };
      } else {
        return { success: false, data: false };
      }
    } catch (error) {
      console.error("Error liking blog: ", error);
      return { success: false, data: false };
    }
  }

  async dislikeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>> {
    try {
      const response = await this.dataBaseServiceInstance.deleteData<any>("BlogLikeByUser", {
        userId: userID,
        blogId: blogID,
      });
      if (response.dataSuccess) {
        return { success: true, data: true };
      } else {
        return { success: false, data: false };
      }
    } catch (error) {
      console.error("Error disliking blog: ", error);
      return { success: false, data: false };
    }
  }

  async userLikedBlogs(userID: string): Promise<APIResponseInterface<string[]>> {
    try {
      const response = await this.dataBaseServiceInstance.fetchData<any>("BlogLikeByUser", undefined, undefined, {
        userId: userID,
      });
      if (response.dataSuccess) {
        const likedBlogs = response.data?.map((item: any) => item.dataValues.blogId) || [];
        return { success: true, data: likedBlogs };
      } else {
        return { success: false, data: [] };
      }
    } catch (error) {
      console.error("Error fetching user liked blogs: ", error);
      return { success: false, data: [] };
    }
  }

  private fetchFriend = async (friendId: any): Promise<IUserFriend["friendDetails"][number]> => {
    const friendDetails = await this.dataBaseServiceInstance.fetchData<any>("User", undefined, undefined, {
      id: friendId
    });
    if(!friendDetails.dataSuccess){
      throw new Error(`Failed to fetch details for friend with ID: ${friendId}`);
    }
    const friendData = friendDetails.data[0].dataValues;
    return {
      id: friendData.id,
      name: friendData.name,
      createdAt: friendData.createdAt,
      status: friendData.status || "",
      aboutMe: friendData.aboutMe || "",
      userImage: friendData.userImage || "",
      numberOfTrips: friendData.numberOfTrips || 0,
      numberOfBlogs: friendData.numberOfBlogs || 0
    };
  };

  async fetchUserFriendsDetails(userId: string): Promise<APIResponseInterface<IUserFriend>> {
    try {
      const result : IUserFriend = {
        friendDetails: [],
        pendingFriendRequests: []
      }
      const userAddedFriends = await this.dataBaseServiceInstance.fetchData<any>("UserFriends",undefined,undefined,{
        userId: userId
      });
      const friendAddedUser = await this.dataBaseServiceInstance.fetchData<any>("UserFriends",undefined,undefined,{
        friendId: userId
      });
      if(!userAddedFriends.dataSuccess || !friendAddedUser.dataSuccess){
        throw new Error("Failed to fetch user friends details");
      }
      console.log("Fetched user added friends: ", userAddedFriends.data);
      console.log("Fetched friend added user: ", friendAddedUser.data);
      
      const friendIds = [
        ...userAddedFriends.data.map((f: any) => f.dataValues),
        ...friendAddedUser.data.map((f: any) => f.dataValues)
      ];
      result.friendDetails = await Promise.all(friendIds.filter((item) => item.status === "Friend").map((item) => this.fetchFriend(item.friendId || item.userId)));
      result.pendingFriendRequests = await Promise.all(
        friendIds
          .filter((item) => item.status === "Pending" || item.status === "Reject")
          .map(async (item): Promise<IUserFriend["pendingFriendRequests"][number]> => ({
            ...(await this.fetchFriend(item.friendId || item.userId)),
            status: item.status === "Reject" ? "Reject" : "Pending"
          }))
      );
      console.log("Final friend details result: ", result);
      return {success : true , data: result };
    } catch(error){
      console.log("Error" , error);
      return { success: false, data: { friendDetails: [], pendingFriendRequests: [] } };
    }
  }

  async searchUserProfile(searchName: string , userId : string): Promise<APIResponseInterface<ISearchUserProfileResult[]>> {
    try {
      const allUsers = await this.dataBaseServiceInstance.fetchData<any>("User");
      if(!allUsers.dataSuccess){
        throw new Error("Failed to fetch all users");
      }
      const users = allUsers.data.map((user: any) => user.dataValues);
      const searcher = new FuzzySearch(users, ['name'], {
        caseSensitive: false,
      });

      const result = searcher.search(searchName);

      return { success: true, data: result.filter((user:any) => user.id != userId ).map((user: any) => ({
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        aboutMe: user.aboutMe || "",
        userImage: user.userImage || "",
        numberOfTrips: user.numberOfTrips || 0,
        numberOfBlogs: user.numberOfBlogs || 0
      })) };
    } catch(error){
      console.log("Error on searchUserProfile", error);
      return { success: false, data: [] };
    }
  }

  async addFriend(userID: string, friendID: string): Promise<APIResponseInterface<boolean>> {
    try {
      console.log("Adding friend with userID:", userID, "and friendID:", friendID);
      const friendDetails = await this.dataBaseServiceInstance.fetchData<any>("User",undefined , undefined, {
          id: friendID
      });

      if(!friendDetails.dataSuccess){
        throw new Error("Failed to fetch friend details");
      }

      const friendData = friendDetails.data[0].dataValues;

      const result = await this.dataBaseServiceInstance.createData("UserFriends", {
        userId: userID,
        friendId: friendID,
        status:"Pending",
        friendName : friendData.name
      });
      if(result.dataSuccess){
        return { success: true, data: true };
      } else {
        throw new Error("Failed to add friend");
      }
    } catch(error){
      console.log("Error", error);
      return { success: false, data: false };
    }
  }

  async takeActionOnFriendRequest(userID: string, friendID: string, action: "Accept" | "Reject"): Promise<APIResponseInterface<boolean>> {
    try {
      const result = await this.dataBaseServiceInstance.updateData("UserFriends", {
        status: action === "Accept" ? "Friend" : "Reject"
      }, {
          userId: userID,
          friendId: friendID
      });
      if(result.dataSuccess){
        return { success: true, data: true };
      } else {
        throw new Error("Failed to take action on friend request");
      }
    } catch(error){
      console.log("Error", error);
      return { success: false, data: false };
    }
  }

  async countTotalNumberOfMemoriesLeft(userId: string): Promise<APIResponseInterface<number>> {
    try {
      const userDetails = await this.dataBaseServiceInstance.fetchData<any>("User", undefined, undefined, {
        id: userId
      },["totalNumberOfMemoriesLeft"]);
      if(!userDetails.dataSuccess){
        throw new Error("Failed to fetch user details");
      }
      const userData = userDetails.data[0].dataValues;
      return { success: true, data: userData.totalNumberOfMemoriesLeft || 0 };
    } catch(error){
      console.log("Error", error);
      return { success: false, data: 0 };
    }
  }
}
