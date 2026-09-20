import model from "../../../DB/model";
import { ISplitWiseResponse } from "../../../Interface/ClassInterface/ISplitWiseGroup";
import ISettlementService from "../../../Interface/ClassInterface/ISplitWiseUser";

export default class SettlementService implements ISettlementService {
    constructor(id : number , name : string , tripID: number){
        this.id = id;
        this.name = name;
        this.tripID = tripID;
        this.balances = new Map<number, number>();
    }
    id: number = 0;
    name: string = "";
    tripID: number = 0;
    balances: Map<number, number>;

    updateBalance = async (splitAmong: {userId : number , userName : string , amount : number}[], tripExpenseID: number): Promise<ISplitWiseResponse>  => {
        await Promise.all(splitAmong.map(async ({userId , userName, amount}) => {
            const tripSettlement = await model.TripSettlement.create({
                tripID: this.tripID,
                fromUserID: this.id,
                fromUserName: this.name,
                toUserID: userId,
                toUserName: userName,
                amount: amount,
                isSettled: false,
                tripExpenseID: tripExpenseID
            });
            if(!tripSettlement) {
                return { splitOptSuccess: false };
            }
        }));
        return { splitOptSuccess: true };
    }

    async notify(message: string): Promise<void> {
    }
}