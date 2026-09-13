"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SlidingLog_1 = __importDefault(require("./RateLimiterAlgoStrategy/SlidingLog"));
class RateLimitStrategyFactory {
    constructor() {
        this.getStrategy = (policy) => {
            switch (policy.strategy) {
                case "token-bucket":
                    // Return an instance of the TokenBucket strategy
                    // return new TokenBucket();
                    throw new Error("TokenBucket strategy not implemented yet.");
                case "sliding-log":
                    return new SlidingLog_1.default(policy);
                default:
                    throw new Error(`Unknown strategy: ${policy.strategy}`);
            }
        };
    }
}
exports.default = RateLimitStrategyFactory;
