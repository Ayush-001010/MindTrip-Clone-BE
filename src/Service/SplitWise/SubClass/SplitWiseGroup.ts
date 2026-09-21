import model from "../../../DB/model";
import ISplitWiseExpense from "../../../Interface/ClassInterface/ISplitWiseExpense";
import SplitWiseExpenses from "./SplitWiseExpenses";
import ISplitWiseGroup, { ISplitWiseAnalyticsData, ISplitWiseResponse } from "../../../Interface/ClassInterface/ISplitWiseGroup";
import ISplitWiseUser from "../../../Interface/ClassInterface/ISplitWiseUser";
import SettlementService from "./SettlementService";
import ITripExpense from "../../../Interface/DataInterface/ITripExpense";

export default class SplitWiseGroup implements ISplitWiseGroup {
    tripID: number;
    splitWiseExpenseInstance: SplitWiseExpenses;

    constructor(tripID: number) {
        this.tripID = tripID;
        this.splitWiseExpenseInstance = new SplitWiseExpenses(this.tripID);
    }
    addExpense = async (paidBy :{userId: number, userName: string} , totalAmount:number, title : string , category : string, spendAt: Date, splitMethod: "equal" | "percentage" | "custom" | "ratio", splitAmong: {userId : number , userName : string , amount : number}[] ,  notes?: string): Promise<ISplitWiseResponse>  => {
        
        const addExpenseResult : ISplitWiseResponse = await this.splitWiseExpenseInstance.addExpense(paidBy, totalAmount, title, category, spendAt, splitMethod, splitAmong, notes);
        if(!addExpenseResult.splitOptSuccess) {
            return { splitOptSuccess: false };
        }
        const expenseId = addExpenseResult.data as number;
        if (expenseId === undefined) {
            return { splitOptSuccess: false };
        }
        const splitWiseUserInstance = new SettlementService(paidBy.userId, paidBy.userName, this.tripID);
        const updateBalanceResult = await splitWiseUserInstance.updateBalance(splitAmong, expenseId);

        if(!updateBalanceResult.splitOptSuccess) {
            return { splitOptSuccess: false };
        }

        return { splitOptSuccess: true };
    }
    fetchExpenses = async (): Promise<ISplitWiseResponse> => {
        const splitWiseExpenseInstance = new SplitWiseExpenses(this.tripID);
        const fetchExpensesResult = await splitWiseExpenseInstance.fetchExpenses();
        if(!fetchExpensesResult.splitOptSuccess) {
            return { splitOptSuccess: false };
        }
        return { splitOptSuccess: true, data: fetchExpensesResult.data };
    }
    analitics = async (userID : string): Promise<ISplitWiseResponse> => {
        const expenses = await this.fetchExpenses();
        if(!expenses.splitOptSuccess) {
            return { splitOptSuccess: false };
        }
        const { data } = expenses;
        const totalExpenses = (data as ITripExpense[]).reduce((sum, expense) => sum + expense.totalAmount, 0);
        let ownedExpenses = 0 , receivedExpenses = 0 , activities = 0, hotel = 0, transport = 0, food = 0, dress = 0;
        const balances =  new Map<number, {userName: string, amount: number , userID : number }>();
        await Promise.all((data as ITripExpense[]).map(async (expense) => {
            const tripExpenseShares = await this.splitWiseExpenseInstance.fetchExpenseDetails(expense.id);
            if(expense.category.includes("surffing") || expense.category.includes("trek")) {
                activities += expense.totalAmount;
            } else if(expense.category.includes("hotel")) {
                hotel += expense.totalAmount;
            } else if(expense.category.includes("transport") || expense.title.toLowerCase().includes("cab") || expense.title.toLowerCase().includes("taxi") || expense.title.toLowerCase().includes("uber") || expense.title.toLowerCase().includes("transport") || expense.title.toLowerCase().includes("bus") || expense.title.toLowerCase().includes("train") || expense.title.toLowerCase().includes("flight") || expense.title.toLowerCase().includes("rapido") || expense.title.toLowerCase().includes("auto") || expense.title.toLowerCase().includes("ola")) {
                transport += expense.totalAmount;
            } else if(expense.category.includes("food")) {
                food += expense.totalAmount;
            } else if(expense.category.includes("dress")) {
                dress += expense.totalAmount;
            }
            if(expense.paidByUserID === parseInt(userID)) {
                ownedExpenses += expense.totalAmount;
                tripExpenseShares.forEach(share => {
                    if(share.userID === parseInt(userID)) {
                        return;
                    }
                    if(!balances.has(share.userID)) {
                        balances.set(share.userID, { userName: share.userName, amount: 0, userID: share.userID });
                    }
                    const balance = balances.get(share.userID)!;
                    balance.amount += share.ownedAmount;
                });
            } else {
                receivedExpenses += tripExpenseShares.filter(share => share.userID === parseInt(userID)).reduce((sum, share) => sum + share.ownedAmount, 0);
                tripExpenseShares.forEach(share => {
                    if(share.userID === parseInt(userID)) {
                        return;
                    }
                    if(!balances.has(share.userID)) {
                        balances.set(share.userID, { userName: share.userName, amount: 0, userID: share.userID });
                    }
                    const balance = balances.get(share.userID)!;
                    balance.amount -= share.ownedAmount;
                });
            }
        }));
        const analytics : ISplitWiseAnalyticsData = {
            totalExpenses,
            ownedExpenses,
            receivedExpenses,
            balances: Array.from(balances.values()),
            activities: activities,
            hotel: hotel,
            transport: transport,
            food: food,
            dress: dress,
        };
        return { splitOptSuccess: true, data: analytics };
    }
};