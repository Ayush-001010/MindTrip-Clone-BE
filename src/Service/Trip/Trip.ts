import ICloudService from "../../Interface/ClassInterface/ICloudService";
import ITripInterface from "../../Interface/ClassInterface/ITripInterface";
import IExploreTrip from "../../Interface/DataInterface/IExploreTrip";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CloudFactory from "../Cloud/CloudFactory";
import DataBaseService from "../Database/Database";
import CommonService from "../Common/CommonService";
import { v4 as uuidv4 } from 'uuid';
import ITripDetails from "../../Interface/DataInterface/ITripDetails";

export default class Trip implements ITripInterface {
    dataBaseServiceInstance : DataBaseService;
    cloudServiceInstance : ICloudService;

    constructor(){
        this.dataBaseServiceInstance = new DataBaseService();    
        this.cloudServiceInstance = CloudFactory.getCloudServiceInstance();
    }

    exploreTrip = async (pageNo : number) : Promise<APIResponseInterface<IExploreTrip[] | null>> => {
        const dbFetchExploreTripResponse = await this.dataBaseServiceInstance.fetchData<IExploreTrip[]>("ExploreTrip", 4, (pageNo - 1) * 4);
        console.log("Fetch Data From Database : ", dbFetchExploreTripResponse);

        if(dbFetchExploreTripResponse.dataSuccess){
            const { data : exploreTripData} = dbFetchExploreTripResponse;
            exploreTripData?.forEach(trip => {
                const cloudResponse = this.cloudServiceInstance.getImages(trip.image || "");
                if(cloudResponse.cloudServiceSuccess && cloudResponse.data){
                    trip.image = cloudResponse.data;
                }
            });
            return { success: true, data: exploreTripData };
        } else {
            return { success: false, error : "Failed to fetch data from database", data: null };
        }
    }

    createNewTrip = async (userID : string) : Promise<APIResponseInterface<{ "url" : string }>> => {
        try {
            const commonServiceInstance = CommonService.getInstance();
            const tripID = uuidv4();
            // Use UUID path so we encode 16 raw bytes (short ~22 chars)
            const base62 = commonServiceInstance.convertBase62(tripID, { isUUID: true });
            const dbResponse = await this.dataBaseServiceInstance.createData("TripID", {
                userID: userID,
                tripID: tripID,
                base62: base62
            });
            if(dbResponse.dataSuccess){
                return { success: true, data: { "url": base62 } };
            } else {
                return { success: false, error: "Failed to create new trip" };
            }
        } catch(error){
            console.log("Error  ",error);
            return { success: false, error: "Failed to create new trip"};
        }
    }

    fetchTripDetails = async (tripID : string) : Promise<APIResponseInterface<ITripDetails|null>> => {
        const dbFetchTripDetailsResponse = await this.dataBaseServiceInstance.fetchData<ITripDetails[]>("TripDetails", 1, 0, { tripID });
        console.log("Fetch Trip Details From Database : ", dbFetchTripDetailsResponse);

        if(dbFetchTripDetailsResponse.dataSuccess){
            const tripDetailsData = dbFetchTripDetailsResponse.data?.[0] || null;
            return { success: true, data: tripDetailsData };
        } else {
            return { success: false, error : "Failed to fetch trip details from database", data: null };
        }
    }
}