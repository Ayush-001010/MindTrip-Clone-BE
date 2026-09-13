"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RedisStore_1 = __importDefault(require("../RateLimiterStore/RedisStore"));
class SlidingLog {
    constructor(policy) {
        this.policy = policy;
    }
    async check(user) {
        const storeClient = new RedisStore_1.default().getRedisClient();
        const now = Date.now();
        const windowMs = (this.policy.duration ?? 2) * 1000;
        const limit = this.policy.limit ?? 5;
        const member = `${user.userName}:${now}:${Math.random().toString(36).slice(2)}`;
        const slidingLogLua = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local member = ARGV[4]

  local minScore = now - windowMs

  redis.call("ZREMRANGEBYSCORE", key, 0, minScore)
  local currentCount = redis.call("ZCARD", key)

  if currentCount >= limit then
    return {0, currentCount}
  end

  redis.call("ZADD", key, now, member)
  redis.call("PEXPIRE", key, windowMs)

  return {1, currentCount + 1}
`;
        const result = (await storeClient.eval(slidingLogLua, 1, `rl:${user.userName}`, now, windowMs, limit, member));
        if (result[0] === 0) {
            return false; // User has exceeded the limit
        }
        return true; // Return true if the user is allowed, false otherwise
    }
}
exports.default = SlidingLog;
