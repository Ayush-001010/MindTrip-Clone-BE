import { ConnectionOptions } from "bullmq";

export const REEL_QUEUE = "reelQueue";
export const REEL_BATCH_QUEUE = "reelQueue-Batch";
export const REEL_STORYBOARD_QUEUE = "reelQueue-Storyboard";

// The API and the worker must use the same Redis, otherwise jobs are never picked up.
export const reelQueueConnection: ConnectionOptions = {
    host: process.env.BULLMQ_REDIS_HOST || "127.0.0.1",
    port: Number(process.env.BULLMQ_REDIS_PORT || 6379),
};

export interface IReelJobData {
    memoryId: number;
}

export interface IReelBatchJobData {
    memoryId: number;
    tag: string;
    mediaIds: number[];
}

export interface IReelStoryboardJobData {
    memoryId: number;
}
