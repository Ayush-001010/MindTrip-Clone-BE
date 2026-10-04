import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IBlogData from "../DataInterface/IBlogData";

export interface IFetchBlogFilter {
    page: number;
    placeName?: string;
    budget?: number;
    noOfPlaces?: number;
    profileOrTitle?: string;
    metaData?: string[];
}

export interface IFetchBlogResult {
    blogs: IBlogData[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export default interface IBlogService{
    getMetaDataForBlog : () => Promise<APIResponseInterface<string[]>>;
    createNewBlog: (blogData: IBlogData) => Promise<APIResponseInterface<string>>;
    fetchTopFiveBlogs: () => Promise<APIResponseInterface<IBlogData[]>>;
    fetchBlog: (filter: IFetchBlogFilter) => Promise<APIResponseInterface<IFetchBlogResult>>;
    fetchBlogByID: (id: number) => Promise<APIResponseInterface<IBlogData>>;
    fetchProfileAndTitle: () => Promise<{profile: string; title: string }[]>;
}