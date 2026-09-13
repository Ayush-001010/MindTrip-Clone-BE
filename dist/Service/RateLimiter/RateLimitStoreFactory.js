"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RedisStore_1 = __importDefault(require("./RateLimiterStore/RedisStore"));
class RateLimitStoreFactory {
    constructor() {
        this.getRateLimitStore = () => {
            // For now, we are only using RedisStore. In future, we can add more stores like InMemoryStore, etc.
            return new RedisStore_1.default();
        };
    }
}
exports.default = RateLimitStoreFactory;
