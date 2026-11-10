import IBlogGlobeFeedService, { IBlogPlace } from "../../Interface/ClassInterface/IBlogGlobeFeed";
import DataBaseService from "../Database/Database";

export default class BlogGlobeFeedService implements IBlogGlobeFeedService {
    dbInstance : DataBaseService;

    constructor() {
        this.dbInstance = new DataBaseService();
    }

    fetchBlogUniquePlaces = async () : Promise<IBlogPlace[]> => {
        try {
            const response = await this.dbInstance.groupBy("BlogActivity", ["placeName", "longitude", "latitude"]);
            if(response.dataSuccess && response.data){
                return response.data as IBlogPlace[];
            }
            return [];
        } catch (error) {
            console.log("Error  ",error);
            return [];
        }
    }
}