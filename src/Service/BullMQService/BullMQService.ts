import IBullMQService, { IBullMQReadOpt , IBullMQCreateOpt} from "../../Interface/ClassInterface/IBullMQService";
import BullMQReadOpt from "./Read/BullMQReadOpt";
import BullMQCreateOpt from "./Create/BullMQCreateOpt";

export default class BullMQService implements IBullMQService {
    private readOpt : IBullMQReadOpt;
    private createOpt : IBullMQCreateOpt;

    constructor() {
        this.readOpt = new BullMQReadOpt();
        this.createOpt = new BullMQCreateOpt();
    }

    addToReelQueue = async (memoryId: number): Promise<boolean> => {
        return this.createOpt.addToReelQueue(memoryId);
    }
}