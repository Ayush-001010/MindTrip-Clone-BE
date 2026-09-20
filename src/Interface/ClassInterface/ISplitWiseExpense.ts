import ITripExpenseShare from "../DataInterface/ITripExpenseShare";
import { ISplitWiseResponse } from "./ISplitWiseGroup";

export default interface ISplitWiseExpense {
    tripID: number;
    addExpense : (paidBy :{userId: number, userName: string} , totalAmount:number, title : string , category : string, spendAt: Date, splitMethod: "equal" | "percentage" | "custom" | "ratio",   splitAmong: {userId : number , userName : string , amount : number}[] ,  notes?: string) => Promise<ISplitWiseResponse>;
    fetchExpenses: () => Promise<ISplitWiseResponse>;
    fetchExpenseDetails : (expenseID: number) => Promise<ITripExpenseShare[]>;
}