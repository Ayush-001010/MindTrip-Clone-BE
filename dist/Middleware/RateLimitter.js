"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PolicyProvider_1 = __importDefault(require("../Service/RateLimiter/PolicyProvider"));
const RateLimitStrategyFactory_1 = __importDefault(require("../Service/RateLimiter/RateLimitStrategyFactory"));
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({
                message: "User authentication required",
            });
        }
        const user = {
            userName: `user:${userId}`,
            isUserHasPremiumAccess: false,
        };
        // Get Police for Rate Limiter
        const policy = (new PolicyProvider_1.default()).getPolicy(user);
        // Get StrategyObject for Rate Limiter
        const strategyObject = (new RateLimitStrategyFactory_1.default()).getStrategy(policy);
        // Check if the user is allowed to proceed
        if (await strategyObject.check(user)) {
            next(); // User is allowed, proceed to the next middleware or route handler
        }
        else {
            res.status(429).json({ message: 'Too Many Requests' }); // User has exceeded the rate limit
        }
    }
    catch (error) {
        return res.status(429).json({ message: 'Internal Server Error At Rate Limiter' });
    }
};
exports.default = rateLimiterMiddleware;
