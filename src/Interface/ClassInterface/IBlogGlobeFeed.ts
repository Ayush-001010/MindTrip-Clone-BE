export interface IBlogPlace {
    placeName: string;
    longitude: number;
    latitude: number;
    count: number;
}


export default interface IBlogGlobeFeedService {
    fetchBlogUniquePlaces : () => Promise<IBlogPlace[]>;
}