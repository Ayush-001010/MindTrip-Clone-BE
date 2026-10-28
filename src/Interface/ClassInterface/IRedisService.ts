export interface IRedisOutput {
    redisOptSuccess: boolean;
    value?: string;
}

export default interface IRedisService {
    createOrUpdate(key: string, value: string  | object, optType:"list" | "other"): Promise<IRedisOutput>;
    get(key: string): Promise<IRedisOutput>;
}