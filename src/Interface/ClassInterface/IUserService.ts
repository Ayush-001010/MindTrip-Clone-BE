import IImportantDateRange from "../DataInterface/IImportantDateRange";
import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export default interface IUserService {
    fetchImportantDates(userID: string): Promise<{dateRange : IImportantDateRange[] , birthdayDate: Date, anniversaryDate: Date} | null>;
    fetchUserDetails(userID: string): Promise<{name: string, email: string} | null>;
    followUser(UserID : string , followingUserID: string): Promise<APIResponseInterface<boolean>>;
    likeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>>;
    dislikeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>>;
    userLikedBlogs(userID: string): Promise<APIResponseInterface<string[]>>;
}