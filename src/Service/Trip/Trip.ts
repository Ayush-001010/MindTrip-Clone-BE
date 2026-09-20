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

    fetchTripMemberDetails = async (tripID : string) : Promise<APIResponseInterface<Array<{
        "userId": string;
        "userName": string;
        "userEmail": string;
    }>|null>> => {
        const dbTripIDFetchResponse = await this.dataBaseServiceInstance.fetchData<{
            "id": string;
        }[]>("TripID", 1, 0, { base62: tripID });
        console.log("Fetch Trip ID From Database : ", dbTripIDFetchResponse);
        if(!dbTripIDFetchResponse.dataSuccess){
            return { success: false, error : "Failed to fetch trip ID from database", data: null };
        }
        const tripIDFromDB = dbTripIDFetchResponse.data?.[0]?.id || "";

        const dbFetchTripMemberDetailsResponse = await this.dataBaseServiceInstance.fetchData<{
            "userId": string;
        }[]>("UserTripMappingTable", undefined, 0, { tripDetailsId: tripIDFromDB });
        const result : Array<{
            "userId": string;
            "userName": string;
            "userEmail": string;
        }> = [];
        if(dbFetchTripMemberDetailsResponse.dataSuccess){
            for(const member of dbFetchTripMemberDetailsResponse.data || []){
                const dpFetchUserDetailsResponse = await this.dataBaseServiceInstance.fetchData<{
                    "id": string;
                    "name": string;
                    "email": string;
                }[]>("User", 1, 0, { id: member.userId || "" });
                if(dpFetchUserDetailsResponse.dataSuccess){
                    const user = dpFetchUserDetailsResponse.data?.[0];
                    if(user){
                        result.push({
                            "userId": user.id || "",
                            "userName": user.name || "",
                            "userEmail": user.email || ""
                        });
                    }
                }
            }
            return { success: true, data: result };
        }
        console.log("Fetch Trip Member Details From Database : ", dbFetchTripMemberDetailsResponse);
        
        return { success: false, error : "Failed to fetch trip member details from database", data: null };
    }

    createUserInvite = async (tripID: string, inviteUserBy: string): Promise<APIResponseInterface<{
        "url": string;
    }>> => {
        const inviteURLID = uuidv4();
        const commonServiceInstance = CommonService.getInstance();
        const base62InviteURLID = commonServiceInstance.convertBase62(inviteURLID , {
            isUUID: true
        });
        const dbOptResponse = await this.dataBaseServiceInstance.createData("UserInvite",{
            inviteURLID,
            base62: base62InviteURLID,
            tripID,
            inviteUserBy
        });
        if(dbOptResponse.dataSuccess){
            return { success: true, data: {  "url": `http://localhost:3000/i/${base62InviteURLID}` } };
        }
        return { success: false, error : "Failed to create user invite in database", data: {url : ""}};
    }

    validateUserInvite = async (
        inviteURLID: string
    ): Promise<
        APIResponseInterface<{
            tripID: string;
            tripName: string;
            inviteUserBy: string;
        } | null>
    > => {
    
        const dbUserInviteResponse = await this.dataBaseServiceInstance.fetchData<{
            tripID: string;
            inviteUserBy: string;
            createdAt: Date | string;
        }[]>("UserInvite", 1, 0, { inviteURLID });
    
        console.log("Fetch Invite From Database : ", dbUserInviteResponse);
    
        if (!dbUserInviteResponse.dataSuccess) {
            return {
                success: false,
                error: "Failed to fetch invite from database",
                data: null
            };
        }
    
        const inviteData = dbUserInviteResponse.data?.[0];
    
        if (!inviteData) {
            return {
                success: false,
                error: "INVITE_NOT_FOUND",
                data: null
            };
        }
    
        const createdAt = new Date(inviteData.createdAt).getTime();
        const currentTime = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;
    
        if (Number.isNaN(createdAt)) {
            return {
                success: false,
                error: "INVITE_INVALID",
                data: null
            };
        }
    
        if (currentTime - createdAt >= thirtyMinutes) {
            return {
                success: false,
                error: "INVITE_EXPIRED",
                data: null
            };
        }
    
        const tripID = inviteData.tripID;
    
        const dbTripResponse = await this.dataBaseServiceInstance.fetchData<{
            tripID: string;
        }[]>("TripID", 1, 0, { tripID });
    
        console.log("Fetch Trip From Database : ", dbTripResponse);
    
        if (!dbTripResponse.dataSuccess || !dbTripResponse.data?.[0]) {
            return {
                success: false,
                error: "TRIP_NOT_FOUND",
                data: null
            };
        }
    
        const dbTripDetailsResponse =
            await this.dataBaseServiceInstance.fetchData<{
                tripID: string;
                tripName: string;
            }[]>("TripDetails", 1, 0, { tripID });
    
        console.log(
            "Fetch Trip Details From Database : ",
            dbTripDetailsResponse
        );
    
        if (
            !dbTripDetailsResponse.dataSuccess ||
            !dbTripDetailsResponse.data?.[0]
        ) {
            return {
                success: false,
                error: "TRIP_DETAILS_NOT_FOUND",
                data: null
            };
        }
    
        const tripDetails = dbTripDetailsResponse.data[0];
    
        return {
            success: true,
            data: {
                tripID,
                tripName: tripDetails.tripName,
                inviteUserBy: inviteData.inviteUserBy
            }
        };
    };
    resolveUserInviteShortUrl = async (
        base62: string
    ): Promise<APIResponseInterface<{ inviteURLID: string } | null>> => {
    
        const dbUserInviteResponse = await this.dataBaseServiceInstance.fetchData<{
            inviteURLID: string;
        }[]>("UserInvite", 1, 0, { base62 });
    
        console.log("Resolve Short URL : ", dbUserInviteResponse);
    
        if (!dbUserInviteResponse.dataSuccess) {
            return {
                success: false,
                error: "Failed to resolve invite URL",
                data: null
            };
        }
    
        const inviteData = dbUserInviteResponse.data?.[0];
    
        if (!inviteData) {
            return {
                success: false,
                error: "INVITE_NOT_FOUND",
                data: null
            };
        }
    
        return {
            success: true,
            data: {
                inviteURLID: inviteData.inviteURLID
            }
        };
    };

    fetchFinalItinerary = async (base62: string): Promise<APIResponseInterface<ITripDetails & { countUserOnTrip: number } | null>> => {
        console.log("Fetching final itinerary for tripID: ", base62);

        const dbTripDFetchResponse = await this.dataBaseServiceInstance.fetchData<{id:number , tripID:string}[]>("TripID", 1, 0, { base62 });

        if(!dbTripDFetchResponse.dataSuccess){
            return { success: false, error : "Failed to fetch final itinerary from database", data: null };
        }
        const tripID = dbTripDFetchResponse.data?.[0].tripID || null;
        const _id = dbTripDFetchResponse.data?.[0].id || null;

        const dpTripDetailsResponse = await this.dataBaseServiceInstance.fetchData<any>("TripDetails", 1, 0, { tripID });
        const countUserOnTrip = await this.dataBaseServiceInstance.countData("UserTripMappingTable",{
            tripDetailsId: _id
        });

        if(!dpTripDetailsResponse.dataSuccess || !countUserOnTrip.dataSuccess){
            return { success: false, error : "Failed to fetch final itinerary details from database", data: null };
        }
        const tripDetailsData = dpTripDetailsResponse.data?.[0] || null;

        return {
            success: true,
            data: tripDetailsData
                ? { ...tripDetailsData.dataValues, countUserOnTrip: countUserOnTrip.data || 0 }
                : null
        };

    }

    setTripStartAndEnd = async (base62: string, startDate: string, endDate: string): Promise<APIResponseInterface<null>> => {
        try {
            const dbTripDFetchResponse = await this.dataBaseServiceInstance.fetchData<{id:number , tripID:string}[]>("TripID", 1, 0, { base62 });
            const tripID = dbTripDFetchResponse.data?.[0].tripID || null;
            const dbOptResponse = await this.dataBaseServiceInstance.updateData("TripDetails", { startDate, endDate }, { tripID });
            if(!dbOptResponse.dataSuccess){
                return { success: false, error: "Failed to set trip start and end dates", data: null };
            }
            return { success: true, error: "", data: null };
        } catch (error) {
            console.log("Error  ",error);
            return { success: false, error: "Failed to set trip start and end dates", data: null };
        }
    }
    setTripBudget = async (base62: string, budget: number): Promise<APIResponseInterface<null>> => {
        try {
            const dbTripDFetchResponse = await this.dataBaseServiceInstance.fetchData<{id:number , tripID:string}[]>("TripID", 1, 0, { base62 });
            const tripID = dbTripDFetchResponse.data?.[0].tripID || null;
            const dbOptResponse = await this.dataBaseServiceInstance.updateData("TripDetails", { budget }, { tripID });
            if(!dbOptResponse.dataSuccess){
                return { success: false, error: "Failed to set trip budget", data: null };
            }
            return { success: true, error: "", data: null };
        } catch (error) {
            console.log("Error  ",error);
            return { success: false, error: "Failed to set trip budget", data: null };
        }
    }
}