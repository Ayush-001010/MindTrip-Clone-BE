"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PolicyProvider {
    constructor() {
        this.getPolicy = (userContext) => {
            if (userContext.isUserHasPremiumAccess) {
                return {
                    strategy: "token-bucket",
                };
            }
            else {
                return {
                    strategy: "sliding-log",
                    limit: 5,
                    duration: 2
                };
            }
        };
    }
}
exports.default = PolicyProvider;
