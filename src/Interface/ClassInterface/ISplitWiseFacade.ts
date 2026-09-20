import { ISplitWiseResponse } from "./ISplitWiseGroup";
import ISplitWiseUser from "./ISplitWiseUser";

export default interface ISplitWiseFacade {
    tripId: number;
    addExpense: (paidBy :{userId: number, userName: string} , totalAmount:number, title : string , category : string, spendAt: Date, splitMethod: "equal" | "percentage" | "custom" | "ratio"   , splitAmong: {userId : number , userName : string , amount : number}[] ,  notes?: string) => Promise<ISplitWiseResponse>;
    analitics: (userID : string) => Promise<ISplitWiseResponse>;
    fetchExpenses: () => Promise<ISplitWiseResponse>;
}