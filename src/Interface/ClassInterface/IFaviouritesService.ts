import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export interface IFaviouritesCollection {
    id?: number;
    name: string;
    createdBy: string;
}

export interface IFaviouritesActivity {
    id?: number;
    collectionId?: number;
    placeName: string;
    activityImage: string;
    activityName: string;
    activityAddress: string;
    activityDescription: string;
    activityLocation: string;
    rating: number;
    reviews: number;
    longitude: number;
    latitude: number;
}

export interface IFaviouritesHotel {
    id?: number;
    collectionId?: number;
    placeName: string;
    hotelName: string;
    hotelImage: string;
    hotelDescription: string;
    longitude: number;
    latitude: number;
    rating: number;
    reviews: number;
    link: string;
    price: number;
}

export interface IFaviouritesBlog {
    id?: number;
    collectionId?: number;
    blogID: number;
    blogTitle: string;
    blogImage: string;
    blogDescription: string;
    rating: number;
    reviews: number;
}

export default interface IFaviouritesService{
    getCollections(createdBy : string): Promise<APIResponseInterface<IFaviouritesCollection[]>>;
    createCollection(name: string, createdBy: string): Promise<APIResponseInterface<IFaviouritesCollection | null>>;
    addFavourites(collectionId: number, type : "activity"| "hotel" | "blog" , data : IFaviouritesActivity | IFaviouritesHotel | IFaviouritesBlog): Promise<APIResponseInterface<boolean>>;
    getCollectionDetails(collectionId:number , type : "Activity"| "Hotel" | "Blog" ): Promise<APIResponseInterface<IFaviouritesActivity[] | IFaviouritesHotel[] | IFaviouritesBlog[]>>;
}