export default interface ITripDetails {
    id: string;
    tripID: string;
    tripName: string;
    tripItinerary: string;
    startDate: string;
    endDate: string;
    budget: number;
    createdAt: Date;
    updatedAt: Date;
}