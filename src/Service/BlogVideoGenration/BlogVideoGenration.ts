import IBlogVideoGeneration, {
    IPreparedVideo,
    ITranscriptSegment,
    IVideoFrame,
} from "../../Interface/ClassInterface/IBlogVideoGenration";
import sharp from "sharp";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const MAX_FRAMES = 20;
const MIN_FRAME_INTERVAL_SECONDS = 3;
const FRAME_WIDTH = 512;
const MAX_VIDEO_SECONDS = 10 * 60;
const WHISPER_URL = process.env.WHISPER_URL || "http://localhost:9000";

export default class BlogVideoGenration implements IBlogVideoGeneration {
    async resizeImageTo1024px(filePath: string): Promise<string> {
        const outputFilePath = filePath.replace(/(\.\w+)$/, "_1024$1");
        await sharp(filePath)
            .resize({ width: 1024 })
            .toFile(outputFilePath);
        return outputFilePath;
    }

    private async getDuration(filePath: string): Promise<number> {
        const { stdout } = await execFileAsync("ffprobe", [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            filePath,
        ]);
        const duration = parseFloat(stdout.trim());
        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error("Could not read video duration");
        }
        return duration;
    }

    private async hasAudio(filePath: string): Promise<boolean> {
        const { stdout } = await execFileAsync("ffprobe", [
            "-v", "error",
            "-select_streams", "a",
            "-show_entries", "stream=index",
            "-of", "csv=p=0",
            filePath,
        ]);
        return stdout.trim().length > 0;
    }

    private async extractFrames(
        filePath: string,
        mediaId: string,
        duration: number,
        outDir: string
    ): Promise<IVideoFrame[]> {
        // Widen the interval for long videos so the frame count stays bounded.
        const interval = Math.max(MIN_FRAME_INTERVAL_SECONDS, duration / MAX_FRAMES);
        const timestamps: number[] = [];
        for (let t = 0; t < duration && timestamps.length < MAX_FRAMES; t += interval) {
            timestamps.push(Number(t.toFixed(1)));
        }

        const frames: IVideoFrame[] = [];
        for (const t of timestamps) {
            const framePath = path.join(outDir, `${mediaId}_${t}.jpg`);
            await execFileAsync("ffmpeg", [
                "-y",
                "-ss", String(t),
                "-i", filePath,
                "-frames:v", "1",
                "-vf", `scale=${FRAME_WIDTH}:-2`,
                "-q:v", "4",
                framePath,
            ]);
            if (fs.existsSync(framePath)) {
                frames.push({ path: framePath, timestamp: t, label: `${mediaId}@${t}s` });
            }
        }
        return frames;
    }

    private async transcribe(filePath: string, outDir: string): Promise<ITranscriptSegment[]> {
        if (!(await this.hasAudio(filePath))) return [];

        const wavPath = path.join(outDir, "audio.wav");
        await execFileAsync("ffmpeg", [
            "-y", "-i", filePath,
            "-vn", "-ac", "1", "-ar", "16000",
            wavPath,
        ]);

        const form = new FormData();
        form.append("audio_file", fs.createReadStream(wavPath));

        try {
            const { data } = await axios.post(`${WHISPER_URL}/asr`, form, {
                params: { task: "transcribe", output: "json", word_timestamps: true },
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                timeout: 5 * 60 * 1000,
            });

            return (data.segments || [])
                .filter((s: any) => s.text?.trim() && (s.no_speech_prob ?? 0) < 0.6)
                .map((s: any) => ({
                    start: s.start,
                    end: s.end,
                    text: s.text.trim(),
                    words: (s.words || []).map((w: any) => ({
                        word: w.word.trim(),
                        start: w.start,
                        end: w.end,
                    })),
                }));
        } catch (error) {
            // Transcript is an optional signal; the storyboard can still be built from frames.
            console.error("Whisper transcription failed:", (error as Error).message);
            return [];
        }
    }

    async prepareVideo(filePath: string, mediaId: string): Promise<IPreparedVideo> {
        const duration = await this.getDuration(filePath);
        if (duration > MAX_VIDEO_SECONDS) {
            throw new Error(`Video is longer than ${MAX_VIDEO_SECONDS / 60} minutes`);
        }

        const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `reel-${mediaId}-`));
        const cleanup = () => fs.promises.rm(workDir, { recursive: true, force: true });

        try {
            const [frames, transcript] = await Promise.all([
                this.extractFrames(filePath, mediaId, duration, workDir),
                this.transcribe(filePath, workDir),
            ]);
            return { mediaId, duration, frames, transcript, cleanup };
        } catch (error) {
            await cleanup();
            throw error;
        }
    }
}
