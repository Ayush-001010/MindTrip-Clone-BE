import INotificationObserval from "./INotificationObserval";
import { ISplitWiseResponse } from "./ISplitWiseGroup";

export default interface ISettlementService extends INotificationObserval {
    id: number;
    name: string;
    balances: Map<number, number>;
    tripID: number;
    updateBalance: (splitAmong: {userId : number , userName : string , amount : number}[], tripExpenseID: number) => Promise<ISplitWiseResponse>;
    notify: (message: string) => Promise<void>;
}