import {Request , Response , NextFunction} from 'express';
import { IPolicy } from '../Interface/ClassInterface/IPolicyProvider';
import IUserInfo from '../Interface/DataInterface/IUserInfo';
import PolicyProvider from '../Service/RateLimiter/PolicyProvider';
import RateLimitStrategyFactory from '../Service/RateLimiter/RateLimitStrategyFactory';

const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Dummy User Object for Rate Limiter
        const user : IUserInfo = {
            userName: 'JohnDoe',
            isUserHasPremiumAccess: false
        }

        // Get Police for Rate Limiter
        const policy : IPolicy = (new PolicyProvider()).getPolicy(user);
        // Get StrategyObject for Rate Limiter
        const strategyObject = (new RateLimitStrategyFactory()).getStrategy(policy);

        // Check if the user is allowed to proceed
        if (await strategyObject.check(user)) {
            next(); // User is allowed, proceed to the next middleware or route handler
        } else {
            res.status(429).json({ message: 'Too Many Requests' }); // User has exceeded the rate limit
        }
        
    } catch (error) {
        return res.status(429).json({ message: 'Internal Server Error At Rate Limiter' });
    }
};

export default rateLimiterMiddleware;