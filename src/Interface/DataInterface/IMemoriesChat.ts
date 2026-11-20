export default interface IMemoriesChat {
    id: number;
    roomId: number | null;
    memoryId: number | null;
    userMessage: string;
    botMessage: string | null;
    userName: string | null;
    actionType: "Start" | "Other" | null;
    createdAt: Date;
    updatedAt: Date;
}