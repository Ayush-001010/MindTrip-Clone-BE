import IBlogData from "../DataInterface/IBlogData";
import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export interface IBlogFeed {
    fetchTrendingBlog(): Promise<APIResponseInterface<IBlogData[]>>;
    tredingBlog(): Promise<void>;
    getUserFeedBlogs(userID : string) : Promise<APIResponseInterface<IBlogData[]>>;
    addBlogToFriendAndFollowers(blogID: string, userID: string): Promise<void>;
}