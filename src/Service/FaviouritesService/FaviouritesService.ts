import IFaviouritesService, { IFaviouritesCollection, IFaviouritesActivity, IFaviouritesHotel, IFaviouritesBlog } from "../../Interface/ClassInterface/IFaviouritesService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../Database/Database";

export default class FaviouritesService implements IFaviouritesService {
    
    async getCollections(createdBy : string): Promise<APIResponseInterface<IFaviouritesCollection[]>> {
        try {
            const dbInstance = new DataBaseService();
            const dbOpt = await dbInstance.fetchData<IFaviouritesCollection[]>("Collections",undefined,undefined, { createdBy });
            if(dbOpt.dataSuccess && dbOpt.data) {
                console.log("Fetched collections successfully:", dbOpt.data);
                return { success: true, data: dbOpt.data };
            } else {
                return { success: false, data: [] };
            }
        } catch (error) {
            console.log("Error fetching collections:", error);
            return { success : false , data : []};
        }
    }

    async createCollection(name: string, createdBy: string): Promise<APIResponseInterface<IFaviouritesCollection | null>> {
        try {
            const dbInstance = new DataBaseService();
            const dbOpt = await dbInstance.createData<IFaviouritesCollection>("Collections", { 
                name, createdBy 
            });
            if(dbOpt.dataSuccess && dbOpt.data) {
                console.log("Created collection successfully:", dbOpt.data);
                return { success: true, data: dbOpt.data };
            } else {
                return { success: false, data: null };
            }
        } catch (error) {
            console.log("Error creating collection:", error);
            return { success : false , data : null};
        }
    }

    async addFavourites(collectionId: number, type : "activity"| "hotel" | "blog" , data : IFaviouritesActivity | IFaviouritesHotel | IFaviouritesBlog): Promise<APIResponseInterface<boolean>>  {
        try {
            const dbInstance = new DataBaseService();
            switch(type) {
                case "activity":
                    const activityData = data as IFaviouritesActivity;
                    const dbOpt = await dbInstance.createData<IFaviouritesActivity>("FavouritesActivity", {
                        collectionId,
                        placeName: activityData.placeName,
                        activityImage: activityData.activityImage,
                        activityName: activityData.activityName,
                        activityAddress: activityData.activityAddress,
                        activityDescription: activityData.activityDescription,
                        activityLocation: activityData.activityLocation,
                        rating: activityData.rating,
                        reviews: activityData.reviews,
                        longitude: activityData.longitude,
                        latitude: activityData.latitude
                    });
                    if(dbOpt.dataSuccess && dbOpt.data) {
                        console.log("Added favourite successfully:", dbOpt.data);
                        return { success: true, data: true };
                    } else {
                        return { success: false, data: false };
                    }
                case "hotel": {
                    const hotelData = data as IFaviouritesHotel;
                    const dbOptHotel = await dbInstance.createData<IFaviouritesHotel>("FavouritesHotel", {
                        collectionId,
                        placeName: hotelData.placeName,
                        hotelName: hotelData.hotelName,
                        hotelImage: hotelData.hotelImage,
                        hotelDescription: hotelData.hotelDescription,
                        longitude: hotelData.longitude,
                        latitude: hotelData.latitude,
                        rating: hotelData.rating,
                        reviews: hotelData.reviews,
                        link: hotelData.link,
                        price: hotelData.price
                    });
                    if(dbOptHotel.dataSuccess && dbOptHotel.data) {
                        console.log("Added favourite hotel successfully:", dbOptHotel.data);
                        return { success: true, data: true };
                    } else {
                        return { success: false, data: false };
                    }
                }
                case "blog": {
                    const blogData = data as IFaviouritesBlog;
                    const dbOptBlog = await dbInstance.createData<IFaviouritesBlog>("FavouritesBlog", {
                        collectionId,
                        blogID: blogData.blogID,
                        blogTitle: blogData.blogTitle,
                        blogImage: blogData.blogImage,
                        blogDescription: blogData.blogDescription,
                        rating: blogData.rating,
                        reviews: blogData.reviews
                    });
                    if(dbOptBlog.dataSuccess && dbOptBlog.data) {
                        console.log("Added favourite blog successfully:", dbOptBlog.data);
                        return { success: true, data: true };
                    } else {
                        return { success: false, data: false };
                    }
                }
                default:
                    return { success: false, data: false };
            }
        } catch(error){
            console.log("Error adding favourite:", error);
            return { success: false, data: false };
        }
    }
}