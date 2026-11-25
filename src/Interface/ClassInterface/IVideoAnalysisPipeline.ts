import { IMemoryVisualMedia } from "./IMemories";

export default interface IVideoAnalysisPipeline {
    /**
     * Processes videos sequentially and saves two-pass, frame-reviewed segments
     * in analysisResult. Requires ffmpeg/ffprobe and AWS_CloudFront_Domain.
     * Optional WHISPER_URL uses a Whisper /asr endpoint; failures are saved as
     * warnings. Other failures throw for BullMQ. Temporary files are cleaned.
     */
    analyseVideo : (items: IMemoryVisualMedia[], tag: string) => Promise<boolean>;
}