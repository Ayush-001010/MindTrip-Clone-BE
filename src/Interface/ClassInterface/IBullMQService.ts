export interface IBullMQReadOpt {}

export interface IBullMQCreateOpt {
    addToReelQueue : (memoryId: number) => Promise<boolean>
}


export default interface IBullMQService {
    addToReelQueue : (memoryId: number) => Promise<boolean>
}