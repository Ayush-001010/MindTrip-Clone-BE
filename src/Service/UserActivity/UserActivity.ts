import IUserActivity from "../../Interface/ClassInterface/IUserActivity";
import DataBaseService from "../Database/Database";

export default class UserActivity implements IUserActivity {
    dbInstance : DataBaseService;

    constructor() {
        this.dbInstance = new DataBaseService();
    }

    createActivity = async (userId: number, activity: "blog" | "place" | "dislike" | "like" | "search", blogId?: number, place?: number) => {
        try {
            await this.dbInstance.createData("UserActivity",{
                userId,
                activity,
                blogId,
                place
            });

            return { success: true };
        } catch(error){
            console.log("Error creating activity:", error);
            return { success: false };
        }
    }

}