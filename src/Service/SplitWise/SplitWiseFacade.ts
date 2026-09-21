import ISplitWiseFacade from "../../Interface/ClassInterface/ISplitWiseFacade";
import ISplitWiseGroup, { ISplitWiseResponse } from "../../Interface/ClassInterface/ISplitWiseGroup";
import SplitWiseGroup from "./SubClass/SplitWiseGroup";

export default class SplitWiseFacade implements ISplitWiseFacade {
    tripId: number;
    private splitWiseGroupInstance: ISplitWiseGroup;

    constructor(tripId: number) {
        this.tripId = tripId;
        this.splitWiseGroupInstance = new SplitWiseGroup(tripId);
    }


    addExpense = async (paidBy :{userId: number, userName: string} , totalAmount:number, title : string , category : string, spendAt: Date, splitMethod: "equal" | "percentage" | "custom" | "ratio", splitAmong: {userId : number , userName : string , amount : number}[] ,  notes?: string) : Promise<ISplitWiseResponse> => {
        const response = await this.splitWiseGroupInstance.addExpense(paidBy, totalAmount, title, category, spendAt, splitMethod, splitAmong, notes);
        return response;
    }

    analitics = async (userID : string) : Promise<ISplitWiseResponse> => {
        const response = await this.splitWiseGroupInstance.analitics(userID);
        return response;
    }

    fetchExpenses = async () : Promise<ISplitWiseResponse> => {
        const response = await this.splitWiseGroupInstance.fetchExpenses();
        return response;
    }
}