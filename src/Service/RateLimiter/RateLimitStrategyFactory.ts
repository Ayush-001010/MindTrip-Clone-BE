import { IPolicy } from "../../Interface/ClassInterface/IPolicyProvider";
import IRateLimitStrategy from "../../Interface/ClassInterface/IRateLimitStrategy";
import IRateLimitStrategyFactory from "../../Interface/ClassInterface/IRateLimitStrategyFactory";
import SlidingLog from "./RateLimiterAlgoStrategy/SlidingLog";

export default class RateLimitStrategyFactory implements IRateLimitStrategyFactory {
    
    getStrategy = (policy : IPolicy) : IRateLimitStrategy => {
        switch(policy.strategy) {
            case "token-bucket":
                // Return an instance of the TokenBucket strategy
                // return new TokenBucket();
                throw new Error("TokenBucket strategy not implemented yet.");
            case "sliding-log":
                return new SlidingLog(policy);
            default:
                throw new Error(`Unknown strategy: ${policy.strategy}`);
        }
    }
    
}