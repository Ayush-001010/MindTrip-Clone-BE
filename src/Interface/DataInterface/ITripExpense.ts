export default interface ITripExpense {
    id: number;
    tripID: number;
    paidByUserID: number;
    totalAmount: number;
    title: string;
    category: string;
    splitMethod: "equal" | "percentage" | "custom";
    notes?: string;
    spendAt: Date;
}