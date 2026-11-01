export interface IVideoFrame {
    path: string;
    timestamp: number;
    label: string;
}

export interface ITranscriptWord {
    word: string;
    start: number;
    end: number;
}

export interface ITranscriptSegment {
    start: number;
    end: number;
    text: string;
    words?: ITranscriptWord[];
}

export interface IPreparedVideo {
    mediaId: string;
    duration: number;
    frames: IVideoFrame[];
    transcript: ITranscriptSegment[];
    cleanup: () => Promise<void>;
}

export default interface IBlogVideoGeneration {
    resizeImageTo1024px : (filePath: string) => Promise<string>;
    prepareVideo : (filePath: string, mediaId: string) => Promise<IPreparedVideo>;
}
