import { Op } from "sequelize";
import IBlogService, { IFetchBlogFilter, IFetchBlogResult } from "../../Interface/ClassInterface/IBlogService";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import IBlogData, { IBlogActivite, IBlogHotel, IBlogTravel } from "../../Interface/DataInterface/IBlogData";
import DataBaseService from "../Database/Database";

export default class BlogService implements IBlogService { 
    private dbInstance: DataBaseService;

    constructor() {
        this.dbInstance = new DataBaseService();
    }

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
            
            // Adding Blog
            const dbResponseBlog = await this.dbInstance.createData<any>("Blog",{
                tripTitle : blogData?.tripTitle,
                tripOverview : blogData?.tripOverview,
                totalSpent : blogData?.totalSpent,
                tripDuration : blogData?.tripDuration,
                noOfPlaces : blogData?.noOfPlaces,
                noOfActivities : blogData?.noOfActivities,
                bookingURL : blogData?.bookingURL,
                metaData: blogData?.metaData?.join(","),
                profileImages: (blogData?.profileImages as string[]).join(","),
                profileTitle: blogData?.profileTitle,
                profileIcon: blogData?.profileIcon,
                numberOfLikes: blogData?.numberOfLikes || 0,
            });

            if(!dbResponseBlog.dataSuccess){
                return { success: false, data: "" };
            }
            console.log("DB Response: ", dbResponseBlog);

            const blogId = dbResponseBlog.data.id;
            console.log("Blog ID: ", blogId);

            // Adding Activity for Blog
            await Promise.all(blogData.activities.map(async (activity) => {
                console.log("Adding activity: ", activity);
                const dbResponseActivity = await this.dbInstance.createData<any>("BlogActivity",{
                    day: activity.day,
                    placeName: activity.placeName,
                    activityType: activity.activityType,
                    blogId: blogId,
                    time: activity.time,
                    description: activity.description,
                    tips: activity.tips?.join(","),
                    coordinates: JSON.stringify(activity.coordinates),
                    images: activity.images?.join(","),
                    sideActivities: JSON.stringify(activity.sideActivities),
                    amountSpent: activity.amountSpent,
                });
                console.log("DB Response Activity: ", dbResponseActivity);
                return dbResponseActivity;
            }));

            await Promise.all(blogData?.hotel.map(async (hotel) => {
                return await this.dbInstance.createData<any>("BlogHotel",{
                    name: hotel.name,
                    address: hotel.address,
                    checkInDate: hotel.checkInDate,
                    checkOutDate: hotel.checkOutDate,
                    amountSpent: hotel.amountSpent,
                    blogId: blogId,
                });
            }));

            await Promise.all(blogData?.travel.map(async (travel) => {
                return await this.dbInstance.createData<any>("BlogTravel",{
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

    fetchTopFiveBlogs = async (): Promise<{ success: boolean; data: IBlogData[] }> => {
        try {
            const dbResponse = await this.dbInstance.fetchData<IBlogData[]>("Blog",5,0,undefined,[["numberOfLikes", "DESC"]]);
            if(dbResponse.dataSuccess && dbResponse.data && dbResponse.data?.length > 0){
                dbResponse.data.forEach(blog => {
                    blog.numberOfLikes = blog.numberOfLikes || 0;
                    blog.profileImages = (blog.profileImages as string)?.split(",") || [];
                });
                return { success: true, data: dbResponse.data };
            }
            return { success: false, data: [] };
        } catch (error) {
            console.log("Error fetching top five blogs: ", error);
            return { success: false, data: [] };
        }
    }

    fetchBlog = async (filter: IFetchBlogFilter): Promise<APIResponseInterface<IFetchBlogResult>> => {
        const limit = 10;
        const page = Math.max(1, Math.floor(filter.page) || 1);
        const emptyResult: IFetchBlogResult = { blogs: [], page, limit, totalCount: 0, totalPages: 0 };
        try {
            const conditions: any[] = [];

            const placeName = filter.placeName?.trim();
            if (placeName) {
                const activityResponse = await this.dbInstance.fetchData<any[]>("BlogActivity", undefined, undefined, {
                    placeName: { [Op.like]: `%${placeName}%` }
                });
                if (!activityResponse.dataSuccess) {
                    return { success: false, data: emptyResult };
                }
                const blogIds = [...new Set((activityResponse.data || []).map((activity: any) => activity.blogId))];
                if (blogIds.length === 0) {
                    return { success: true, data: emptyResult };
                }
                conditions.push({ id: { [Op.in]: blogIds } });
            }

            if (filter.budget && filter.budget > 0) {
                conditions.push({ totalSpent: { [Op.lte]: filter.budget } });
            }

            if (filter.noOfPlaces && filter.noOfPlaces > 0) {
                conditions.push({ noOfPlaces: { [Op.lte]: filter.noOfPlaces } });
            }

            const profileOrTitle = filter.profileOrTitle?.trim();
            if (profileOrTitle) {
                conditions.push({
                    [Op.or]: [
                        { profileTitle: { [Op.like]: `%${profileOrTitle}%` } },
                        { tripTitle: { [Op.like]: `%${profileOrTitle}%` } },
                    ]
                });
            }

            const metaData = (filter.metaData || []).map(item => item.trim()).filter(Boolean);
            if (metaData.length > 0) {
                conditions.push({
                    [Op.or]: metaData.map(item => ({ metaData: { [Op.like]: `%${item}%` } }))
                });
            }

            const where = conditions.length > 0 ? { [Op.and]: conditions } : undefined;

            const countResponse = await this.dbInstance.countData<any>("Blog", where);
            if (!countResponse.dataSuccess) {
                return { success: false, data: emptyResult };
            }
            const totalCount = countResponse.data || 0;

            const dbResponse = await this.dbInstance.fetchData<any[]>("Blog", limit, (page - 1) * limit, where, [["createdAt", "DESC"], ["id", "DESC"]]);
            if (!dbResponse.dataSuccess) {
                return { success: false, data: emptyResult };
            }

            const blogs: IBlogData[] = (dbResponse.data || []).map((blog: any) => {
                const plainBlog = blog.get ? blog.get({ plain: true }) : blog;
                return {
                    ...plainBlog,
                    numberOfLikes: plainBlog.numberOfLikes || 0,
                    profileImages: (plainBlog.profileImages as string)?.split(",") || [],
                    metaData: (plainBlog.metaData as string)?.split(",").filter(Boolean) || [],
                };
            });

            return {
                success: true,
                data: { blogs, page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
            };
        } catch (error) {
            console.log("Error fetching blogs: ", error);
            return { success: false, data: emptyResult };
        }
    }

    fetchBlogByID = async (id: number): Promise<APIResponseInterface<IBlogData>> => {
        const emptyBlogData: IBlogData = {
            tripTitle: "",
            tripOverview: "",
            totalSpent: 0,
            tripDuration: 0,
            noOfPlaces: 0,
            noOfActivities: 0,
            activities: [],
            hotel: [],
            bookingURL: "",
            travel: [],
            metaData: [],
            profileImages: [],
            profileTitle: "",
            profileIcon: "",
            numberOfLikes: 0,
        };
        try {
            const blogResponse = await this.dbInstance.fetchData<any[]>("Blog", 1, 0, { id });
            if (!blogResponse.dataSuccess || !blogResponse.data || blogResponse.data.length === 0) {
                return { success: false, data: emptyBlogData };
            }
            const blog = blogResponse.data[0];
            const plainBlog = blog.get ? blog.get({ plain: true }) : blog;

            const [activityResponse, hotelResponse, travelResponse] = await Promise.all([
                this.dbInstance.fetchData<any[]>("BlogActivity", undefined, undefined, { blogId: id }, [["day", "ASC"], ["id", "ASC"]]),
                this.dbInstance.fetchData<any[]>("BlogHotel", undefined, undefined, { blogId: id }, [["id", "ASC"]]),
                this.dbInstance.fetchData<any[]>("BlogTravel", undefined, undefined, { blogId: id }, [["day", "ASC"], ["id", "ASC"]]),
            ]);

            const activities: IBlogActivite[] = (activityResponse.dataSuccess ? activityResponse.data || [] : []).map((activity: any) => {
                const plainActivity = activity.get ? activity.get({ plain: true }) : activity;
                return {
                    type: "activity",
                    day: plainActivity.day,
                    placeName: plainActivity.placeName,
                    activityType: plainActivity.activityType,
                    time: plainActivity.time,
                    description: plainActivity.description,
                    tips: (plainActivity.tips as string)?.split(",").filter(Boolean) || [],
                    coordinates: plainActivity.coordinates ? JSON.parse(plainActivity.coordinates) : { latitude: 0, longitude: 0 },
                    images: (plainActivity.images as string)?.split(",").filter(Boolean) || [],
                    sideActivities: plainActivity.sideActivities ? JSON.parse(plainActivity.sideActivities) : [],
                    amountSpent: plainActivity.amountSpent,
                };
            });

            const hotel: IBlogHotel[] = (hotelResponse.dataSuccess ? hotelResponse.data || [] : []).map((hotelItem: any) => {
                const plainHotel = hotelItem.get ? hotelItem.get({ plain: true }) : hotelItem;
                return {
                    name: plainHotel.hotelName || "",
                    address: plainHotel.address || "",
                    checkInDate: plainHotel.checkInDate,
                    checkOutDate: plainHotel.checkOutDate,
                    amountSpent: plainHotel.amountSpent,
                    description: plainHotel.description,
                    images: plainHotel.images || "",
                };
            });

            const travel: IBlogTravel[] = (travelResponse.dataSuccess ? travelResponse.data || [] : []).map((travelItem: any) => {
                const plainTravel = travelItem.get ? travelItem.get({ plain: true }) : travelItem;
                return {
                    type: "travel",
                    time: plainTravel.time,
                    activityNumber: plainTravel.activityNumber,
                    day: plainTravel.day,
                    travelType: plainTravel.travelType,
                    amountSpent: plainTravel.amountSpent,
                    description: plainTravel.description,
                };
            });

            const blogData: IBlogData = {
                tripTitle: plainBlog.tripTitle,
                tripOverview: plainBlog.tripOverview,
                totalSpent: plainBlog.totalSpent,
                tripDuration: plainBlog.tripDuration,
                noOfPlaces: plainBlog.noOfPlaces,
                noOfActivities: plainBlog.noOfActivities,
                activities,
                hotel,
                bookingURL: plainBlog.bookingURL,
                travel,
                metaData: (plainBlog.metaData as string)?.split(",").filter(Boolean) || [],
                profileImages: (plainBlog.profileImages as string)?.split(",") || [],
                profileTitle: plainBlog.profileTitle,
                profileIcon: plainBlog.profileIcon,
                numberOfLikes: plainBlog.numberOfLikes || 0,
            };

            return { success: true, data: blogData };
        } catch (error) {
            console.log("Error fetching blog by id: ", error);
            return { success: false, data: emptyBlogData };
        }
    }

    fetchProfileAndTitle = async () : Promise<{ profile: string; title: string; }[]> => {
        try {
            const dbResponse = await this.dbInstance.fetchData<any[]>("Blog",1,0,undefined,[["createdAt", "DESC"]]);
            const result : {profile : string; title:string}[] = []; 
            if(dbResponse.dataSuccess && dbResponse.data){
                dbResponse.data.forEach(blog => {
                    result.push({
                        profile: blog.profileTitle || "",
                        title: blog.tripTitle || ""
                    });
                });
            }
            return result;
        } catch (error) {
            console.log("Error fetching profile and title: ", error);
            return [];
        }

    }
}