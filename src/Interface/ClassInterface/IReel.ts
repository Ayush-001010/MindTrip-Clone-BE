import APIResponseInterface from "../ResponseInterface/APIResponseInterface";

export interface IReelData {
    id: number;
    script: string | null;
    placeNames: string | null;
    videoKey: string | null;
    blogId: number | null;
    blogTitle: string | null;
    blogDescription: string | null;
    userName: string;
    userId: number;
}


export default interface IReel {
    fetchReel : (placeName: string) => Promise<APIResponseInterface<IReelData[]>>
}