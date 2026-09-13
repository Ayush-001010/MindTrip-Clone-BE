export interface IRedisOutput {
    redisOptSuccess: boolean;
}

export default interface IRedisService {
    createOrUpdate(key: string, value: string  | object, optType:"list" | "other"): Promise<IRedisOutput>;
}