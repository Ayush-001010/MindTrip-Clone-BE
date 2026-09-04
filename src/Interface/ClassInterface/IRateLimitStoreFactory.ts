import IRateLimitStore from "./IRateLimitStore";

export default interface IRateLimitStoreFactory {
    getRateLimitStore(): IRateLimitStore;
}