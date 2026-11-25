import IReel, { IReelData } from "../../Interface/ClassInterface/IReel";
import DataBaseService from "../Database/Database";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";

export default class ReelService implements IReel {
    private dbInstance : DataBaseService;

    constructor() {
        this.dbInstance = new DataBaseService();
    }

    fetchReel = async (placeName: string): Promise<APIResponseInterface<IReelData[]>> => {
        // Implement the logic to fetch reels based on the placeName
        const response = await this.dbInstance.specialQuery<IReelData[]>("fetchReelsByPlaceName", placeName);
        console.log("Fetch reels response:", response);
        return { success : true , data : response.data ? response.data : [] }
    }
}