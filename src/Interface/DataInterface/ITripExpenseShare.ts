export default interface ITripExpenseShare {
    id: number;
    userID: number;
    amount: number;
    ownedAmount: number;
    isSettled: boolean;
    shareType: "equal" | "percentage" | "custom" | "ratio";
    userName: string;
    tripExpenseID: number;
}