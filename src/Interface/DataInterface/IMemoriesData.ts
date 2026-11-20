export default interface IMemoriesData {
    id: number;
    name: string;
    createdBy: number;
    totalCreditLeft : number;
    numberOfPeopleWorkingCurrently : number;
    progress: number;
    uiType: "type1" | "type2";
    userDetails: { userId: number; userName: string }[];
    place: string;
    workId: string;
    isTripPhotoAndVideoUpload?: boolean;
    isTripAudioUpload?: boolean;
    rooms?:{name : string , id: number }[]
}