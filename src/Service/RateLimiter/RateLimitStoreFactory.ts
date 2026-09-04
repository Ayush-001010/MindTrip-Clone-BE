import IRateLimitStoreFactory from "../../Interface/ClassInterface/IRateLimitStoreFactory";
import IRateLimitStore from "../../Interface/ClassInterface/IRateLimitStore";
import RedisStore from "./RateLimiterStore/RedisStore";

export default class RateLimitStoreFactory implements IRateLimitStoreFactory {

    getRateLimitStore = () : IRateLimitStore => {
        // For now, we are only using RedisStore. In future, we can add more stores like InMemoryStore, etc.
        return new RedisStore();
    }
}