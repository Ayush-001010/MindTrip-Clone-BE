import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export default interface IUserActivity {
    createActivity : (userId: number, activity: "blog" | "place" | "dislike" | "like" | "search", blogId?: number, place?: number) => Promise<APIResponseInterface<boolean>>;
}