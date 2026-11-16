import { Queue } from "bullmq";
import { IBullMQCreateOpt } from "../../../Interface/ClassInterface/IBullMQService";

export default class BullMQCreateOpt implements IBullMQCreateOpt {
    private reelQueue;

    constructor() {
        this.reelQueue = new Queue('reelQueue');
    }
    
    addToReelQueue = async (memoryId: number): Promise<boolean> => {
        try {
            await this.reelQueue.add(`reelJob-${memoryId}`, { memoryId });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}