import IBlogData from "../DataInterface/IBlogData";
import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export interface IBlogFeed {
    tredingBlog(): Promise<void>;
    getUserFeedBlogs(userID : string) : Promise<APIResponseInterface<IBlogData[]>>;
    addBlogToFriendAndFollowers(blogID: string, userID: string): Promise<void>;
}