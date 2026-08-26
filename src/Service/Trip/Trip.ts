import ICloudService from "../../Interface/ClassInterface/ICloudService";
import ITripInterface from "../../Interface/ClassInterface/ITripInterface";
import IExploreTrip from "../../Interface/DataInterface/IExploreTrip";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import CloudFactory from "../Cloud/CloudFactory";
import DataBaseService from "../Database/Database";

export default class Trip implements ITripInterface {
    dataBaseServiceInstance : DataBaseService;
    cloudServiceInstance : ICloudService;

    constructor(){
        this.dataBaseServiceInstance = new DataBaseService();    
        this.cloudServiceInstance = CloudFactory.getCloudServiceInstance();
    }
    exploreTrip = async (pageNo : number) : Promise<APIResponseInterface<IExploreTrip[] | null>> => {
        const dbFetchExploreTripResponse = await this.dataBaseServiceInstance.fetchData<IExploreTrip[]>("ExploreTrip", 10, (pageNo - 1) * 10);
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
}