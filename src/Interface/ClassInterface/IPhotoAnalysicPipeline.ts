import { IMemoryVisualMedia } from "./IMemories";

export interface IPhotoPipelineResult {
    analysed: number;
    duplicates: number;
    unreadable: number;
}

export default interface IPhotoAnalysicPipeline {
    analysePhoto: (items: IMemoryVisualMedia[], tag: string) => Promise<IPhotoPipelineResult>;
}
