import APIResponseInterface from "../ResponseInterface/APIResponseInterface";
import IBlogData from "../ResponseInterface/IBlogData";

export default interface IBlogService{
    getMetaDataForBlog : () => Promise<APIResponseInterface<string[]>>;
    createNewBlog: (blogData: IBlogData) => Promise<APIResponseInterface<string>>;
}