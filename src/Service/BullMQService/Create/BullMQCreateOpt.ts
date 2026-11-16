import { Queue } from "bullmq";
import { IBullMQCreateOpt } from "../../../Interface/ClassInterface/IBullMQService";
import { IReelJobData, REEL_QUEUE, reelQueueConnection } from "../../../Queue/reelQueueConfig";

// Shared so each BullMQService instance doesn't open its own Redis connection.
const reelQueue = new Queue<IReelJobData>(REEL_QUEUE, { connection: reelQueueConnection });

export default class BullMQCreateOpt implements IBullMQCreateOpt {
    addToReelQueue = async (memoryId: number): Promise<boolean> => {
        try {
            await reelQueue.add("reelJob", { memoryId }, {
                jobId: `reel-${memoryId}`,
                removeOnComplete: true,
                removeOnFail: true,
            });
            return true;
        } catch (error) {
            console.error("Failed to add memory to reel queue:", error);
            return false;
        }
    }
}
