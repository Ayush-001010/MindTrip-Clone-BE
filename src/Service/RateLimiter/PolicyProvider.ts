import IUserInfo from "../../Interface/DataInterface/IUserInfo";
import IPolicyProvider, { IPolicy } from "../../Interface/ClassInterface/IPolicyProvider";

export default class PolicyProvider implements IPolicyProvider {
    getPolicy = (userContext : IUserInfo): IPolicy => {
        if(userContext.isUserHasPremiumAccess) {
            return {
                strategy:"token-bucket",
            }
        } else {
            return {
                strategy : "sliding-log",
                limit : 10,
                duration : 2
            }
        }
    }
}