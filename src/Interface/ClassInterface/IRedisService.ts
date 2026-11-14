export interface IRedisOutput {
    redisOptSuccess: boolean;
    value?: string;
}

export interface IRedisListOutput {
    redisOptSuccess: boolean;
    value?: string[];
}

export default interface IRedisService {
    createOrUpdate(key: string, value: string  | object, optType:"list" | "other"): Promise<IRedisOutput>;
    get(key: string): Promise<IRedisOutput>;
    getList(key: string): Promise<IRedisListOutput>;
}