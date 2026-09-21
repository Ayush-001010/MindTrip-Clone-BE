import model from "../../../DB/model";
import ISplitWiseExpense from "../../../Interface/ClassInterface/ISplitWiseExpense";
import { ISplitWiseResponse } from "../../../Interface/ClassInterface/ISplitWiseGroup";
import ITripExpense from "../../../Interface/DataInterface/ITripExpense";
import ITripExpenseShare from "../../../Interface/DataInterface/ITripExpenseShare";

export default class SplitWiseExpenses implements ISplitWiseExpense {
    tripID: number;

    constructor(tripID:number) {
        this.tripID = tripID;
    }

    addExpense: (paidBy: { userId: number; userName: string; }, totalAmount: number, title: string, category: string, spendAt: Date, splitMethod: "equal" | "percentage" | "custom" | "ratio", splitAmong: { userId: number; userName: string; amount: number; }[], notes?: string) => Promise<ISplitWiseResponse> = async (paidBy, totalAmount, title, category, spendAt, splitMethod, splitAmong, notes) => {
        const expense = await model.TripExpense.create({
            tripID: this.tripID,
            paidByUserID: paidBy.userId,
            totalAmount: totalAmount,
            paidByUserName: paidBy.userName,
            title: title,
            category: category,
            splitMethod: splitMethod,
            notes: notes,
            spendAt: spendAt,
        });

        if(!expense) {
            return { splitOptSuccess: false };
        }
        await Promise.all(splitAmong.map(async ({amount, userId,userName}) => { 
            const expenseShare = await model.TripExpenseShare.create({
                expenseID: expense.dataValues.id,
                userID: userId,
                ownedAmount: amount,
                shareType: splitMethod,
                userName: userName,
                isSettled: false,
                tripExpenseID: expense.dataValues.id
            });
            if(!expenseShare) {
                return { splitOptSuccess: false };
            }
        }));
        return { splitOptSuccess: true , data: expense.dataValues.id };
    };

    fetchExpenses: () => Promise<ISplitWiseResponse> = async () => {
        const expenses = await model.TripExpense.findAll({
            where: { tripID: this.tripID }
        });
        if(!expenses) {
            return { splitOptSuccess: false };
        }
        return {
            splitOptSuccess: true,
            data: expenses.map((expense) => expense.dataValues as ITripExpense)
        };
    };

    fetchExpenseDetails = async (expenseID: number): Promise<ITripExpenseShare[]> => {
        const expenseShares = await model.TripExpenseShare.findAll({
            where: { tripExpenseID: expenseID }
        });
        return expenseShares.map((share) => share.dataValues as ITripExpenseShare);
    };
}