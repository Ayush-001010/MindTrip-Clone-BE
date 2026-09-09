export default interface ITripChat {
    id: number;
    userID: string;
    tripID: string;
    message: string;
    response: string;
    messageDate: Date;
}