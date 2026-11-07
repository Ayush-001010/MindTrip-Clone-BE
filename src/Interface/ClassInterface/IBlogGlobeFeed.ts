export interface IBlogPlace {
    placeName: string;
    longitude: number;
    latitude: number;
}


export default interface IBlogGlobeFeedService {
    fetchBlogUniquePlaces : () => Promise<IBlogPlace[]>;
}