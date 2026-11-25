import axios from "axios";
import { execFile } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import FormData from "form-data";
import { z } from "zod";
import IVideoAnalysisPipeline from "../../Interface/ClassInterface/IVideoAnalysisPipeline";
import { IMemoryVisualMedia } from "../../Interface/ClassInterface/IMemories";
import { IVideoFrame, IVideoMetadata, VideoMoment } from "../../Interface/DataInterface/IVideoAnalysis";
import VideoAnalysisAgent from "../Copilot/Agent/VideoAnalysisAgent/VideoAnalysisAgent";
import Memories from "../Memories/Memories";

const execFileAsync = promisify(execFile);
const MAX_BYTES = 500 * 1024 * 1024;
const MAX_SECONDS = 600;
const COMMAND_OPTIONS = { timeout: 180000, maxBuffer: 8 * 1024 * 1024 };

const probeSchema = z.object({
  format: z.object({ duration: z.coerce.number().positive().max(MAX_SECONDS) }),
  streams: z.array(z.object({
    codec_type: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    tags: z.object({ rotate: z.coerce.number().finite().optional() }).optional(),
    side_data_list: z.array(z.object({ rotation: z.number().finite().optional() })).optional(),
    disposition: z.object({ attached_pic: z.number().optional() }).optional(),
  })),
});

const transcriptSchema = z.object({
  segments: z.array(z.object({
    start: z.number().nonnegative(),
    end: z.number().positive(),
    text: z.string(),
    no_speech_prob: z.number().min(0).max(1).optional(),
  })),
});

export default class VideoAnalysisPipelineService implements IVideoAnalysisPipeline {
  private agent = new VideoAnalysisAgent();
  private memories = new Memories();

  private resolveUrl(value: string): string {
    const domain = process.env.AWS_CloudFront_Domain;
    if (!domain) throw new Error("AWS_CloudFront_Domain is required for video downloads");
    const origin = new URL(`https://${domain}`);
    const url = new URL(value, `${origin.origin}/`);
    if (url.protocol !== "https:" || url.host !== origin.host || url.username || url.password) {
      throw new Error("Video URL must belong to the configured HTTPS CDN");
    }
    return url.href;
  }

  private async downloadVideo(url: string, videoPath: string): Promise<void> {
    console.log("[Video analysis] Downloading video from URL:", url);
    const signal = AbortSignal.timeout(5 * 60 * 1000);
    const response = await axios.get<import("node:stream").Readable>(this.resolveUrl(url), {
      responseType: "stream",
      timeout: 60000,
      signal,
      maxRedirects: 0,
    });
    if (Number(response.headers["content-length"]) > MAX_BYTES) {
      response.data.destroy();
      throw new Error("Video exceeds the 500 MB download limit");
    }
    let bytes = 0;
    const limiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        callback(bytes > MAX_BYTES ? new Error("Video exceeds the 500 MB download limit") : null, chunk);
      },
    });
    await pipeline(response.data, limiter, createWriteStream(videoPath, { flags: "wx" }), { signal });
    if (!bytes) throw new Error("Downloaded video is empty");
    console.log("[Video analysis] Download written:", { videoPath, bytes });
  }

  private async probe(videoPath: string): Promise<IVideoMetadata> {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error", "-show_format", "-show_streams", "-of", "json", videoPath,
    ], COMMAND_OPTIONS);
    const data = probeSchema.parse(JSON.parse(stdout));
    const video = data.streams.find(stream =>
      stream.codec_type === "video" && !stream.disposition?.attached_pic);
    if (!video?.width || !video.height) throw new Error("No usable video stream found");
    const angle = video.side_data_list?.find(item => item.rotation !== undefined)?.rotation ??
      video.tags?.rotate ?? 0;
    const rotation = ((angle % 360) + 360) % 360;
    const swapped = rotation === 90 || rotation === 270;
    return {
      duration: data.format.duration,
      width: swapped ? video.height : video.width,
      height: swapped ? video.width : video.height,
      rotation,
      hasAudio: data.streams.some(stream => stream.codec_type === "audio"),
    };
  }

  private async sceneChanges(videoPath: string): Promise<number[]> {
    const { stderr } = await execFileAsync("ffmpeg", [
      "-hide_banner", "-nostdin", "-i", videoPath,
      "-map", "0:V:0", "-an",
      "-vf", "scale=256:-2,select='gt(scene,0.3)',showinfo",
      "-frames:v", "100", "-f", "null", "-",
    ], COMMAND_OPTIONS);
    return [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map(match => Number(match[1]));
  }

  private sample(start: number, end: number, count: number): number[] {
    // Sample within each bin, never at the EOF timestamp.
    return Array.from({ length: count }, (_, i) => start + (end - start) * (i + 0.5) / count);
  }

  private async extractFrames(videoPath: string, times: number[], dir: string, prefix: string): Promise<IVideoFrame[]> {
    const frames: IVideoFrame[] = [];
    for (const [index, timestamp] of times.entries()) {
      const framePath = path.join(dir, `${prefix}-${index}.jpg`);
      await execFileAsync("ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-ss", String(timestamp), "-i", videoPath, "-map", "0:V:0",
        "-frames:v", "1", "-vf", "scale=512:512:force_original_aspect_ratio=decrease",
        "-q:v", "4", framePath,
      ], COMMAND_OPTIONS);
      if (!(await stat(framePath)).size) throw new Error(`Empty frame at ${timestamp}s`);
      frames.push({ path: framePath, timestamp });
      console.log("[Video analysis] Frame extracted:", { framePath, timestamp });
    }
    return frames;
  }

  private async transcribe(videoPath: string, dir: string, hasAudio: boolean, warnings: string[]) {
    const endpoint = process.env.WHISPER_URL;
    if (!hasAudio) {
      console.log("[Video analysis] Transcription skipped: video has no audio", { videoPath });
      return { status: "no-audio" as const, segments: [] };
    }
    if (!endpoint) {
      console.log("[Video analysis] Transcription skipped: WHISPER_URL is not configured", { videoPath });
      return { status: "disabled" as const, segments: [] };
    }
    try {
      const wav = path.join(dir, "audio.wav");
      console.log("[Video analysis] Extracting audio for Whisper:", { videoPath, wav });
      await execFileAsync("ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", videoPath,
        "-vn", "-ac", "1", "-ar", "16000", wav,
      ], COMMAND_OPTIONS);
      const form = new FormData();
      form.append("audio_file", createReadStream(wav));
      console.log("[Video analysis] Sending audio to Whisper:", { wav });
      const response = await axios.post(`${endpoint.replace(/\/$/, "")}/asr`, form, {
        params: { task: "transcribe", output: "json" },
        headers: form.getHeaders(),
        timeout: 300000,
        maxContentLength: 2 * 1024 * 1024,
      });
      const data = transcriptSchema.parse(response.data);
      const segments = data.segments.filter(segment =>
        segment.text.trim() && segment.end > segment.start && (segment.no_speech_prob ?? 0) < 0.6,
      ).map(({ start, end, text }) => ({ start, end, text: text.trim() }));
      console.log("[Video analysis] Whisper response validated:", {
        videoPath, receivedSegments: data.segments.length, retainedSegments: segments.length,
      });
      return { status: "completed" as const, segments };
    } catch (error) {
      console.error("[Video analysis] Optional transcription failed:", {
        videoPath, error: error instanceof Error ? error.message : String(error),
      });
      warnings.push("Speech transcription failed; analysis used visual evidence only.");
      return { status: "failed" as const, segments: [] };
    }
  }

  analyseVideo = async (items: IMemoryVisualMedia[], tag: string): Promise<boolean> => {
    console.log(`Starting video analysis for tag "${tag}" with ${items.length} items`);
    if (!items.length) {
      console.log("[Video analysis] Nothing to process:", { tag });
      return true;
    }
    console.log("[Video analysis] Checking model frame budget:", { tag });
    const budget = await this.agent.frameBudget();
    console.log("[Video analysis] Model frame budget:", { tag, budget });
    for (const item of items) {
      if (item.type !== "video") throw new Error(`Media ${item.id} is not a video`);
      const logPrefix = `[Video analysis ${item.id}]`;
      console.log(`${logPrefix} Starting video:`, { tag });
      const dir = await mkdtemp(path.join(os.tmpdir(), `video-${item.id}-`));
      console.log(`${logPrefix} Temporary folder created:`, dir);
      try {
        const videoPath = path.join(dir, "original.mp4");
        console.log(`${logPrefix} Step 1: Downloading from CDN`);
        await this.downloadVideo(item.url, videoPath);
        console.log(`${logPrefix} Step 1 complete: Download finished`);
        console.log(`${logPrefix} Step 2: Reading FFprobe metadata`);
        const technical = await this.probe(videoPath);
        console.log(`${logPrefix} Step 2 complete:`, technical);
        console.log(`${logPrefix} Step 3: Detecting scene changes`);
        const scenes = (await this.sceneChanges(videoPath)).filter(t => t > 0 && t < technical.duration);
        console.log(`${logPrefix} Scene changes detected:`, scenes);
        const sceneBudget = Math.min(scenes.length, Math.floor(budget / 3));
        const chosenScenes = Array.from({ length: sceneBudget }, (_, i) =>
          scenes[Math.floor(i * scenes.length / sceneBudget)]);
        const times = [...new Set([
          ...this.sample(0, technical.duration, budget - sceneBudget), ...chosenScenes,
        ])].sort((a, b) => a - b);
        console.log(`${logPrefix} Extracting coarse frames at timestamps:`, times);
        const frames = await this.extractFrames(videoPath, times, dir, "coarse");
        console.log(`${logPrefix} Step 3 complete:`, { frameCount: frames.length });
        const warnings: string[] = [];
        console.log(`${logPrefix} Step 4: Optional speech transcription`);
        const transcript = await this.transcribe(videoPath, dir, technical.hasAudio, warnings);
        console.log(`${logPrefix} Step 4 complete:`, {
          status: transcript.status, segmentCount: transcript.segments.length,
        });
        const context = {
          videoId: item.id, tag, duration: technical.duration,
          transcript: transcript.segments.filter(s => s.end <= technical.duration),
        };
        console.log(`${logPrefix} Step 5: Asking AI for candidate moments`);
        const candidates = await this.agent.analyse({
          ...context, pass: "coarse", start: 0, end: technical.duration, frames,
        });
        console.log(`${logPrefix} Step 5 complete: Candidate windows:`,
          candidates.map(({ start, end }) => ({ start, end })));
        const confirmed: VideoMoment[] = [];
        console.log(`${logPrefix} Step 6: Reviewing candidates:`, { candidateCount: candidates.length });
        for (const [index, candidate] of candidates.entries()) {
          console.log(`${logPrefix} Extracting dense frames for candidate ${index + 1}:`, {
            start: candidate.start, end: candidate.end,
          });
          const dense = await this.extractFrames(videoPath,
            this.sample(candidate.start, candidate.end, Math.min(8, budget)), dir, `dense-${index}`);
          console.log(`${logPrefix} Sending candidate ${index + 1} to AI for review:`, {
            frameCount: dense.length,
          });
          const moments = await this.agent.analyse({
            ...context, pass: "confirmation", start: candidate.start, end: candidate.end,
            frames: dense,
            transcript: context.transcript.filter(s => s.end > candidate.start && s.start < candidate.end),
          });
          confirmed.push(...moments);
          console.log(`${logPrefix} Candidate ${index + 1} reviewed:`,
            moments.map(({ start, end }) => ({ start, end })));
        }
        const segments: (VideoMoment & { videoId: number })[] = [];
        for (const moment of confirmed.sort((a, b) => a.start - b.start)) {
          if (!segments.some(existing => moment.start < existing.end && moment.end > existing.start)) {
            segments.push({ videoId: item.id, ...moment });
          }
          if (segments.length === 5) break;
        }
        console.log(`${logPrefix} Step 6 complete:`, {
          reviewedSegments: confirmed.length, selectedSegments: segments.length,
        });
        console.log(`${logPrefix} Step 7: Saving analysis to database`);
        const saved = await this.memories.saveMediaAnalysisResult(item.id, {
          status: "analysed", technical, sceneChanges: scenes,
          transcript, segments, warnings,
          reviewMethod: "two-pass-frame-sampling",
        });
        if (!saved.success) throw new Error(`Failed to save video ${item.id} analysis`);
        console.log(`${logPrefix} Step 7 complete: Analysis saved; media marked processed`);
      } catch (error) {
        console.error(`${logPrefix} Analysis failed:`, error instanceof Error ? error.message : String(error));
        throw error;
      } finally {
        console.log(`${logPrefix} Step 8: Removing temporary folder:`, dir);
        await rm(dir, { recursive: true, force: true });
        console.log(`${logPrefix} Step 8 complete: Temporary folder removed`);
      }
      console.log(`${logPrefix} Finished successfully`);
    }
    console.log("[Video analysis] Tag finished:", { tag, videoCount: items.length });
    return true;
  };
}
