import IBlogService from "../../Interface/ClassInterface/IBlogService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import IBlogData from "../../Interface/ResponseInterface/IBlogData";
import DataBaseService from "../Database/Database";

export default class BlogService implements IBlogService { 

    getMetaDataForBlog = async (): Promise<APIResponseInterface<string[]>> => {
        try {
            const dbInstance = new DataBaseService();
            const dbResponse = await dbInstance.fetchData<any>("MetaDataForBlog");
            if(dbResponse.dataSuccess){
                const metaData = dbResponse.data.map((item: any) => {
                    return item.dataValues.value
                });
                console.log("Meta Data: ", metaData);
                return { success: true, data: metaData };
            } else {
                return { success: false, data: [] };
            }
        } catch (error) {
            console.log("Error  ", error);
            return { success: false, data: [] };
        }
    }

    createNewBlog = async (blogData: IBlogData): Promise<APIResponseInterface<string>> => {
        try {
            const dbInstance = new DataBaseService();
            // Adding Blog
            const dbResponseBlog = await dbInstance.createData<any>("Blog",{
                tripTitle : blogData.tripTitle,
                tripOverview : blogData.tripOverview,
                totalSpent : blogData.totalSpent,
                tripDuration : blogData.tripDuration,
                noOfPlaces : blogData.noOfPlaces,
                noOfActivities : blogData.noOfActivities,
                bookingURL : blogData.bookingURL
            });

            if(!dbResponseBlog.dataSuccess){
                return { success: false, data: "" };
            }
            console.log("DB Response: ", dbResponseBlog);

            const blogId = dbResponseBlog.data.id;
            console.log("Blog ID: ", blogId);

            // Adding Activity for Blog
            await Promise.all(blogData.activities.map((activity) => {
                return dbInstance.createData<any>("BlogActivity",{
                    day: activity.day,
                    placeName: activity.placeName,
                    activityType: activity.activityType,
                    blogId: blogId,
                    time: activity.time,
                    description: activity.description,
                    tips: activity.tips?.join(","),
                    coordinates: activity.coordinates,
                    images: activity.images?.join(","),
                    sideActivities: activity.sideActivities,
                    amountSpent: activity.amountSpent,
                });
            }));

            await Promise.all(blogData.hotel.map((hotel) => {
                return dbInstance.createData<any>("BlogHotel",{
                    name: hotel.name,
                    address: hotel.address,
                    checkInDate: hotel.checkInDate,
                    checkOutDate: hotel.checkOutDate,
                    amountSpent: hotel.amountSpent,
                    blogId: blogId,
                });
            }));

            await Promise.all(blogData.travel.map((travel) => {
                return dbInstance.createData<any>("BlogTravel",{
                    time: travel.time,
                    activityNumber: travel.activityNumber,
                    description: travel.description,
                    amountSpent: travel.amountSpent,
                    day: travel.day,
                    travelType: travel.travelType,
                    blogId: blogId,
                });
            }));

            return { success: true, data: blogId };
        } catch (error) {
            console.log("Error creating new blog: ", error);
        }
        return { success: false, data: "" };
    }
}