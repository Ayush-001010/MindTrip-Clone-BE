import { Redis } from "ioredis";
import IRedisService, { IRedisOutput } from "../../Interface/ClassInterface/IRedisService";

export default class RedisService  implements IRedisService{
    private static redisClientInstance: Redis | null = null;
    private redisClient: Redis;

    constructor() {
        if (!RedisService.redisClientInstance) {
            RedisService.redisClientInstance = new Redis({
                host: process.env.SOCKET_REDIS_HOST || "127.0.0.1",
                port: Number(process.env.SOCKET_REDIS_PORT || 6381),
                maxRetriesPerRequest: 1,
            });

            RedisService.redisClientInstance.on("error", (error) => {
                console.error("Socket Redis connection error:", error.message);
            });
        }

        this.redisClient = RedisService.redisClientInstance;
    }

    private pushToList = async (key: string, serializedValue: string): Promise<void> => {
        const keyType = await this.redisClient.type(key);

        if (keyType === "none" || keyType === "list") {
            await this.redisClient.rpush(key, serializedValue);
            return;
        }

        if (keyType === "string") {
            const existingValue = await this.redisClient.get(key);
            const valuesToStore = existingValue === null ? [serializedValue] : [existingValue, serializedValue];

            await this.redisClient.multi().del(key).rpush(key, ...valuesToStore).exec();
            return;
        }

        throw new Error(`Redis key ${key} has incompatible type ${keyType} for list writes`);
    }

    createOrUpdate = async (key: string, value: string  | object, optType:"list" | "other"): Promise<IRedisOutput> => {
        try {
            console.log("Value  ",value);
            const serializedValue = JSON.stringify(value);
            switch(optType) {
                case "list":
                    await this.pushToList(key, serializedValue);
                    break;
                case "other":
                    await this.redisClient.set(key, serializedValue);
                    break;
            }
            return { redisOptSuccess: true };
        }
        catch (error) {
            console.error("Socket Redis write failed:", error);
            return { redisOptSuccess: false };
        }
    }
}