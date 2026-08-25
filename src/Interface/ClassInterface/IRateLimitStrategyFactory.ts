import { IPolicy } from './IPolicyProvider';
import IRateLimitStrategy from './IRateLimitStrategy';

export default interface IRateLimitStrategyFactory {
    getStrategy(policy : IPolicy) : IRateLimitStrategy;
}