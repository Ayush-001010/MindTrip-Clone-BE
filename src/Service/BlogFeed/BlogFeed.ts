import { IBlogFeed } from "../../Interface/ClassInterface/IBlogFeed";
import IBlogData from "../../Interface/DataInterface/IBlogData";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import DatabaseService from "../Database/Database";
import IDataBaseService from "../../Interface/ClassInterface/IDataBaseService";
import IRedisService from "../../Interface/ClassInterface/IRedisService";
import RedisService from "../RedisService/RedisService";
import CommonService from "../Common/CommonService";

export default class BlogFeed implements IBlogFeed {
    dbInstance: IDataBaseService;
    redisInstance: IRedisService;
    private isBlogIDAlreadyProcessed: Record<string, string[]> = {};

    constructor() {
        this.dbInstance = new DatabaseService();
        this.redisInstance = new RedisService();
    }

    private fetchUserLikedAndDislikeBlogPlacesScore = async (userId : string) => {
        const responseForUserLikedBlog = await this.dbInstance.fetchData<any>("BlogLikeByUser" , 100 , undefined , {
            userId : userId,
        });
        const placeScoreMap: Record<string, number> = {};
        await Promise.all(responseForUserLikedBlog.data.map(async (item: any) => {
            const blogId = item.dataValues?.blogId;
            this.isBlogIDAlreadyProcessed[blogId] = this.isBlogIDAlreadyProcessed[blogId] || [];
            const blogActivity = await this.dbInstance.fetchData<any>("BlogActivity", undefined, undefined, {
                blogId: blogId
            });
            const placeNames = blogActivity.data.map((detail: any) => detail.dataValues?.placeName).filter((place: string) => place);
            this.isBlogIDAlreadyProcessed[blogId] = placeNames;
            placeNames.forEach((placeName: string) => {
                placeScoreMap[placeName] = (placeScoreMap[placeName] || 0) + 1;
            });
        }));
        return placeScoreMap;
    }

    private fetchPlaceScoreAccordingToUserSearch = async (userId: string, placeScoreMap: Record<string, number>) => {
        const userSearchData = await this.dbInstance.fetchData<any>("UserActivity", undefined, undefined, {
            userId: userId,
            activity: "search"
        });
        userSearchData.data.forEach((item: any) => {
            const placeName = item.dataValues?.place;
            if(placeName) {
                placeScoreMap[placeName] = (placeScoreMap[placeName] || 0) + 3;
            }
        });
        return placeScoreMap;
    }

    private fetchPlaceScoreAccordingToUserOpenBlog = async (userId: string, placeScoreMap: Record<string, number>) => {
        const userOpenBlogData = await this.dbInstance.fetchData<any>("UserActivity", undefined, undefined, {
            userId: userId,
            activity: "blog"
        });
        await Promise.all(userOpenBlogData.data.map(async (item: any) => {
            const blogId = item.dataValues?.blogId;
            if(blogId){
                const isBlogIDAlreadyExist = this.isBlogIDAlreadyProcessed[blogId];
                if(isBlogIDAlreadyExist) {
                    isBlogIDAlreadyExist.forEach((placeName: string) => {
                        placeScoreMap[placeName] = (placeScoreMap[placeName] || 0) + 2;
                    });
                } else {
                    const blogDetails = await this.dbInstance.fetchData<any>("BlogActivity", undefined, undefined, {
                        blogId: blogId
                    });
                    const placeNames = blogDetails.data.map((detail: any) => detail.dataValues?.placeName).filter((place: string) => place);
                    this.isBlogIDAlreadyProcessed[blogId] = placeNames;
                    placeNames.forEach((placeName: string) => {
                        placeScoreMap[placeName] = (placeScoreMap[placeName] || 0) + 2;
                    });
                }
            }
        }));
        return placeScoreMap;
    }

    private groupPlacesByBlog = (activities: any[]): Map<string, Set<string>> => {
        const placesByBlog: Map<string, Set<string>> = new Map();
        activities.forEach((activity: any) => {
            const blogId = activity.dataValues?.blogId;
            const placeName = activity.dataValues?.placeName;
            if(!blogId || !placeName) return;
            if(!placesByBlog.has(blogId)) placesByBlog.set(blogId, new Set());
            placesByBlog.get(blogId)!.add(placeName);
        });
        return placesByBlog;
    }

    // score = sum(user's place scores of matching places) / sqrt(distinct places in blog) + 0.3 * likes + recency points
    private fetchBlogsAccordingToPlace = async (placeScoreMap: Record<string, number>, topPlaces: string[]) : Promise<string[]> => {
        if(topPlaces.length === 0) return [];
        const matchedActivities = await this.dbInstance.fetchDataWhereIn<any>("BlogActivity", "placeName", topPlaces);
        const matchedPlacesByBlog = this.groupPlacesByBlog(matchedActivities.data ?? []);
        const blogIds = Array.from(matchedPlacesByBlog.keys());
        if(blogIds.length === 0) return [];

        const [allActivities, blogs] = await Promise.all([
            this.dbInstance.fetchDataWhereIn<any>("BlogActivity", "blogId", blogIds),
            this.dbInstance.fetchDataWhereIn<any>("Blog", "id", blogIds),
        ]);
        const totalPlacesByBlog = this.groupPlacesByBlog(allActivities.data ?? []);
        const blogInfo = (blogs.data ?? []).map((blog: any) => blog.dataValues);

        // Newest 20 blogs get 10 points, next 20 get 9, and so on (minimum 0)
        const recencyPoints: Map<string, number> = new Map();
        [...blogInfo]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .forEach((blog: any, index: number) => {
                recencyPoints.set(String(blog.id), Math.max(10 - Math.floor(index / 20), 0));
            });

        const scored = blogInfo.map((blog: any) => {
            let placeScoreSum = 0;
            matchedPlacesByBlog.get(blog.id)?.forEach((placeName) => {
                placeScoreSum += placeScoreMap[placeName] || 0;
            });
            const totalPlaces = Math.max(totalPlacesByBlog.get(blog.id)?.size ?? 1, 1);
            const score = placeScoreSum / Math.sqrt(totalPlaces)
                + 0.3 * (blog.numberOfLikes ?? 0)
                + (recencyPoints.get(String(blog.id)) ?? 0);
                
            return { blogId: String(blog.id), score };
        });
        console.log("Scored blogs:", scored);

        // Return an ordered array (object keys that look like integers would be re-sorted by JS)
        return scored.sort((a: any, b: any) => b.score - a.score).slice(0, 200).map((item: any) => item.blogId);
    }

    private fetchBlogsAccordingToScore = async (userId: string) => {
        console.log(`Fetching blogs according to score for user: ${userId}`);
        const placeScoreMap = await this.fetchUserLikedAndDislikeBlogPlacesScore(userId);
        console.log(placeScoreMap);
        const updatePlaceScore = await this.fetchPlaceScoreAccordingToUserSearch(userId, placeScoreMap);
        console.log(updatePlaceScore);
        const finalPlaceScore = await this.fetchPlaceScoreAccordingToUserOpenBlog(userId, updatePlaceScore);
        const sortedPlaces = Object.entries(finalPlaceScore).sort((a, b) => b[1] - a[1]);
        const topPlaces = sortedPlaces.map(([placeName]) => placeName);
        console.log(topPlaces);

        return await this.fetchBlogsAccordingToPlace(finalPlaceScore, topPlaces.slice(0, 10));
    }

    private fetchBlogDetails = async (blogID: string[]) : Promise<IBlogData[] | null> => {
        if(blogID.length === 0) return [];
        return await Promise.all(blogID.map(async (id) => {
            const response = await this.dbInstance.fetchData<any>("Blog" , undefined , undefined , {
                id : id
            })
            return response.data as IBlogData;
        }));
    }

    tredingBlog = async () : Promise<void> => {
        const responseSevenDays = await this.dbInstance.specialQuery("mostLikedLastSevenDays");
        const likeDataForLastSevenDays = responseSevenDays.data as Array<{ blogId: string, likeCount: number }> || [];
        const responseTwoHours = await this.dbInstance.specialQuery("mostLikedLastTwoHours");
        const likeDataForLastTwoHours = responseTwoHours.data as Array<{ blogId: string, likeCount: number }> || [];
        const responseDislikedSevenDays = await this.dbInstance.specialQuery("mostDislikedLastSevenDays");
        const dislikeDataForLastSevenDays = responseDislikedSevenDays.data as Array<{ blogId: string, dislikeCount: number }> || [];
        const responseDislikedTwoHours = await this.dbInstance.specialQuery("mostDislikedLastTwoHours");
        const dislikeDataForLastTwoHours = responseDislikedTwoHours.data as Array<{ blogId: string, dislikeCount: number }> || [];

        const blogScoreMap: Record<string, number> = {};
        likeDataForLastSevenDays.forEach((item: any) => {
            blogScoreMap[item.blogId] = item.likeCount;
        });
        likeDataForLastTwoHours.forEach((item: any) => {
            blogScoreMap[item.blogId] = (blogScoreMap[item.blogId] || 0) + item.likeCount + 3;
        });
        dislikeDataForLastSevenDays.forEach((item: any) => {
            blogScoreMap[item.blogId] = (blogScoreMap[item.blogId] || 0) - item.dislikeCount;
        });
        dislikeDataForLastTwoHours.forEach((item: any) => {
            blogScoreMap[item.blogId] = (blogScoreMap[item.blogId] || 0) - item.dislikeCount - 3;
        });

        const sortedBlogs = Object.entries(blogScoreMap)
            .sort((a, b) => b[1] - a[1])
            .map(([blogId, score]) => ({ blogId, score }));
        console.log("Sorted blogs by score:", sortedBlogs);

        await this.redisInstance.createOrUpdate("trendingBlogs", JSON.stringify(sortedBlogs) , "other");
    }

    getUserFeedBlogs = async (userID: string) : Promise<APIResponseInterface<IBlogData[]>> => {
        try {
            const limit = 10; // Number of blogs per page
            const fetchUserFeed = await this.redisInstance.get(`UserFeed:${userID}`);
            if(!fetchUserFeed.redisOptSuccess)
                return { success: false, data: [] };
            const userFeedData : string[] = fetchUserFeed.value ? JSON.parse(fetchUserFeed.value as unknown as string) : [];
            console.log("User feed data:", userFeedData);
            const paginatedData = userFeedData.slice(0, limit);
            if(paginatedData.length === limit) {
                // If this if statement is true, it means we have enough blogs to fill the current page.
                const blogData = await this.fetchBlogDetails(paginatedData);
                const updatedUserFeedData = userFeedData.slice(limit);
                await this.redisInstance.createOrUpdate(`UserFeed:${userID}`, updatedUserFeedData, "other");
                console.log("Fetched blog data:", blogData);
                return { success: true, data: blogData ?? [] };
            } else {
                // If this else statement is true, it means we don't have enough blogs to fill the current page.
                const userFeedRemainingAccordingUserActivity = await this.redisInstance.get(`UserFeedAccordingUserActivity:${userID}`);
                if(!userFeedRemainingAccordingUserActivity.redisOptSuccess)
                    return { success: false, data: [] };
                if(!userFeedRemainingAccordingUserActivity.value) {
                    const newBlogs = await this.fetchBlogsAccordingToScore(userID);

                    const newData = [...paginatedData , ...newBlogs];
                    const result = await this.fetchBlogDetails(newData.slice(0, limit));
                    await this.redisInstance.createOrUpdate(`UserFeedAccordingUserActivity:${userID}`, newData, "other");
                    await this.redisInstance.createOrUpdate(`UserFeed:${userID}`, newData.slice(limit), "other");
                    console.log("New blogs fetched according to score:", newBlogs);
                    console.log("Final user feed data after update:", result);
                    return { success: true, data: result ?? [] };
                } else {
                    const fetchTrendingBlogs = await this.redisInstance.get(`trendingBlogs`);
                    console.log("Fetched trending blogs from Redis:", fetchTrendingBlogs.value);
                    if(!fetchTrendingBlogs.redisOptSuccess)
                        return { success: false, data: [] };
                    let trendingBlogs : any = fetchTrendingBlogs.value ? JSON.parse(fetchTrendingBlogs.value as unknown as string) : [];
                    trendingBlogs = JSON.parse(trendingBlogs as unknown as string);
                    console.log("Trending blogs parsed from Redis:", trendingBlogs);
                    const newData = [...paginatedData, ...trendingBlogs.map((blog:any) => blog.blogId)];
                    console.log("New data after adding trending blogs:", newData);
                    const result = await this.fetchBlogDetails(newData.slice(0, limit));
                    await this.redisInstance.createOrUpdate(`UserFeedAccordingUserActivity:${userID}`, newData, "other");
                    await this.redisInstance.createOrUpdate(`UserFeed:${userID}`, newData.slice(limit), "other");
                    console.log("Trending blogs fetched:", trendingBlogs);
                    console.log("Final user feed data after update:", result);
                    return { success: true, data: result ?? [] };
                }
            }

        } catch (error) {
            console.error("Error fetching user feed blogs: ", error);
            return { success: false, data: [] };
        }
    }

    addBlogToFriendAndFollowers = async (blogID: string, userID: string): Promise<void> => {
        const commonService = new CommonService();
        const friends = await commonService.fetchUserDetails(parseInt(userID));
        const followers = await commonService.fetchUserFollowers(parseInt(userID));
        if(friends && friends.data.length > 0) {
            for(const friend of friends.data) {
                const friendFeed = await this.redisInstance.get(`UserFeed:${friend.friendId}`);
                let friendFeedData = friendFeed.value ? JSON.parse(friendFeed.value as unknown as string) : [];
                friendFeedData = JSON.parse(friendFeedData as unknown as string);
                friendFeedData.unshift(blogID);
                await this.redisInstance.createOrUpdate(`UserFeed:${friend.friendId}`, friendFeedData, "other");
            }
        }
        if(followers && followers.data && followers.data.length > 0) {
            for(const follower of followers.data) {
                const followerFeed = await this.redisInstance.get(`UserFeed:${follower.followerID}`);
                let followerFeedData = followerFeed.value ? JSON.parse(followerFeed.value as unknown as string) : [];
                followerFeedData = JSON.parse(followerFeedData as unknown as string);
                followerFeedData.unshift(blogID);
                await this.redisInstance.createOrUpdate(`UserFeed:${follower.followerID}`, followerFeedData, "other");
            }
        }
    }
}