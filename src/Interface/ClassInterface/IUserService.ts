import IImportantDateRange from "../DataInterface/IImportantDateRange";
import APIResponseInterface from "../ResponseInterface/APIResponseInterface";


export interface IUserFriend {
    friendDetails : {id : string , createdAt: Date ,  aboutMe : string , status : "Friend" , name : string , userImage: string , numberOfTrips : number , numberOfBlogs : number }[];
    pendingFriendRequests : {id : string , createdAt: Date ,  aboutMe : string , status : "Pending" | "Reject" , name : string , userImage: string , numberOfTrips : number , numberOfBlogs : number }[];
}

export interface ISearchUserProfileResult {
    id: string;
    name: string;
    createdAt: Date;
    aboutMe: string;
    userImage: string;
    numberOfTrips: number;
    numberOfBlogs: number;
}

export default interface IUserService {
    fetchImportantDates(userID: string): Promise<{dateRange : IImportantDateRange[] , birthdayDate: Date | null, anniversaryDate: Date | null} | null>;
    fetchUserDetails(userID: string): Promise<{name: string, email: string} | null>;
    followUser(UserID : string , followingUserID: string): Promise<APIResponseInterface<boolean>>;
    likeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>>;
    dislikeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>>;
    userLikedBlogs(userID: string): Promise<APIResponseInterface<string[]>>;
    fetchUserFriendsDetails(userId : string) : Promise<APIResponseInterface<IUserFriend>>;
    searchUserProfile(searchName : string , userId : string) : Promise<APIResponseInterface<ISearchUserProfileResult[]>>;
    addFriend(userID: string, friendID: string): Promise<APIResponseInterface<boolean>>;
    takeActionOnFriendRequest(userID: string, friendID: string, action: "Accept" | "Reject"): Promise<APIResponseInterface<boolean>>;
}