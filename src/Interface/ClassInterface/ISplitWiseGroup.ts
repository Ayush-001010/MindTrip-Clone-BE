import ISplitWiseUser from "./ISplitWiseUser";
import ISplitWiseExpense from "./ISplitWiseExpense";
import ITripExpense from "../DataInterface/ITripExpense";
import SplitWiseExpenses from "../../Service/SplitWise/SubClass/SplitWiseExpenses";

export interface ISplitWiseResponse {
    splitOptSuccess: boolean;
    data?: ITripExpense[] | number | ISplitWiseAnalyticsData;
}

export interface ISplitWiseAnalyticsData {
    totalExpenses: number;
    ownedExpenses: number;
    receivedExpenses: number;
    balances: {userName: string, amount: number , userID : number }[];
    activities: number;
    hotel: number;
    transport: number;
    food: number;
    dress: number;
}

export default interface ISplitWiseGroup {
    tripID: number;
    splitWiseExpenseInstance: SplitWiseExpenses;

    addExpense : (paidBy :{userId: number, userName: string} , totalAmount:number, title : string , category : string, spendAt: Date, splitMethod: "equal" | "percentage" | "custom" | "ratio",   splitAmong: {userId : number , userName : string , amount : number}[] ,  notes?: string) => Promise<ISplitWiseResponse>;
    fetchExpenses: () => Promise<ISplitWiseResponse>;
    analitics: (userID : string) => Promise<ISplitWiseResponse>;

}