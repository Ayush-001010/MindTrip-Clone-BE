import IRateLimitStore from "../../../Interface/ClassInterface/IRateLimitStore";
import Redis from "ioredis";

export default class RedisStore implements IRateLimitStore {
  private redisClient: Redis | null = null;

  getRedisClient = () => {
    if (this.redisClient) {
      return this.redisClient;
    }

    const useDockerNetwork = process.env.REDIS_USE_DOCKER_NETWORK === "true";

    const sentinels = useDockerNetwork
      ? [
          { host: "sentinel-1", port: 26379 },
          { host: "sentinel-2", port: 26379 },
          { host: "sentinel-3", port: 26379 },
        ]
      : [
          { host: "127.0.0.1", port: 26379 },
          { host: "127.0.0.1", port: 26380 },
          { host: "127.0.0.1", port: 26381 },
        ];

    this.redisClient = new Redis({
      sentinels,
      name: "mymaster",
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      natMap: useDockerNetwork
        ? undefined
        : {
            "sentinel-1:26379": { host: "127.0.0.1", port: 26379 },
            "sentinel-2:26379": { host: "127.0.0.1", port: 26380 },
            "sentinel-3:26379": { host: "127.0.0.1", port: 26381 },
            "redis-primary:6379": { host: "127.0.0.1", port: 6379 },
            "redis-replica:6379": { host: "127.0.0.1", port: 6380 },
          },
    });

    this.redisClient.on("error", (error) => {
      console.error("Redis sentinel connection error:", error.message);
    });

    return this.redisClient;
  };
}
