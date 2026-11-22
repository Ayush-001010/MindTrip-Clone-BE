import IBlogGlobeFeedService, { IBlogPlace } from "../../Interface/ClassInterface/IBlogGlobeFeed";
import DataBaseService from "../Database/Database";

export default class BlogGlobeFeedService implements IBlogGlobeFeedService {
    dbInstance : DataBaseService;

    constructor() {
        this.dbInstance = new DataBaseService();
    }

    fetchBlogUniquePlaces = async () : Promise<IBlogPlace[]> => {
        try {
            const response = await this.dbInstance.groupBy<IBlogPlace[]>("BlogActivity", ["placeName", "longitude", "latitude"], true);
            if(response.dataSuccess && response.data){
                return response.data;
            }
            return [];
        } catch (error) {
            console.log("Error  ",error);
            return [];
        }
    }
}