import {
  IMemoriesAgent,
  IMemoriesReelCreation,
} from "../../../Interface/ClassInterface/IMemories";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import CopilotManager from "../../../Manager/CopilotManager";
import {
  characterAnalysisResultSchema,
  MascotColorMode,
} from "../../../Interface/DataInterface/ICharacterSpecification";
import AWS from "../../Cloud/AWS/AWS";
import { execFile } from "node:child_process";
import ReadMemories from "../Read/ReadMemories";
import { beatGrid, buildReelScript, chooseMusicStart, DEFAULT_TARGET_SECONDS } from "../../ReelPlan/ReelScriptBuilder";
import { IMusicAnalysis, IReelClip } from "../../../Interface/DataInterface/IReelPlan";
import ReelDirectorAgent from "../../Copilot/Agent/ReelDirectorAgent/ReelDirectorAgent";
import { downloadMusic, resolveMusicUrl } from "./MusicDownload";

const MAX_CLIPS_FOR_AI = 60;

export default class MemoriesAgent implements IMemoriesAgent {
  convertImageToCartoon = async (
    filePath: string,
    colorMode?: MascotColorMode,
  ) => {
    const imageBuffer = await readFile(filePath);
    const copilotManager = new CopilotManager();
    const response = await copilotManager.genrateCartoon(
      "Genrate cartoon for the attached image",
      imageBuffer,
      colorMode,
    );
    if (!response || !response.success || response.error) {
      return {
        success: false,
        error: response?.error || "Cartoon generation failed.",
      };
    }
    const result = characterAnalysisResultSchema.safeParse(response.data);
    if (!result.success) {
      console.error("Character analysis returned invalid data:", result.error);
      return {
        success: false,
        error: "Character analysis returned invalid data.",
      };
    }
    return {
      success: true,
      data: result.data,
    };
  };

  private SAMPLE_RATE = 22050;
  private WINDOW = 1024;
  private HOP = 512;

  private decodeToSamples = async (source: string): Promise<Float32Array> => {
    return new Promise((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-i",
          source,
          "-ac",
          "1",
          "-ar",
          String(this.SAMPLE_RATE),
          "-f",
          "f32le",
          "pipe:1",
        ],
        { encoding: "buffer", maxBuffer: 200 * 1024 * 1024, timeout: 180_000 },
        (err, stdout) => {
          if (err) return reject(err);
          const copy = Buffer.from(stdout);
          resolve(
            new Float32Array(copy.buffer, copy.byteOffset, copy.byteLength / 4),
          );
        },
      );
    });
  };

  private loudnessCurve(samples: Float32Array): number[] {
    const rms: number[] = [];
    for (
      let start = 0;
      start + this.WINDOW <= samples.length;
      start += this.HOP
    ) {
      let sum = 0;
      for (let i = start; i < start + this.WINDOW; i++)
        sum += samples[i] * samples[i];
      rms.push(Math.sqrt(sum / this.WINDOW)); // RMS = "average loudness"
    }
    return rms;
  }

  private get frameSec() {
    return this.HOP / this.SAMPLE_RATE;
  }

  // Only the positive jumps in loudness: drum hits, strums, claps
  private onsetStrength(rms: number[]): number[] {
    const onset: number[] = [0];
    for (let i = 1; i < rms.length; i++) {
      onset.push(Math.max(0, rms[i] - rms[i - 1]));
    }
    return onset;
  }

  // Which repeat interval (60-180 BPM) lines the onsets up with themselves best
  private estimateBpm(onset: number[]): number {
    const scoreAt = (bpm: number) => {
      const lag = Math.round(60 / bpm / this.frameSec);
      let score = 0;
      for (let i = lag; i < onset.length; i++) score += onset[i] * onset[i - lag];
      return score;
    };

    let bestBpm = 120;
    let bestScore = -Infinity;
    for (let bpm = 60; bpm <= 180; bpm++) {
      const score = scoreAt(bpm);
      if (score > bestScore) {
        bestScore = score;
        bestBpm = bpm;
      }
    }

    // Half-tempo mistake: a pulse every second beat also matches itself well,
    // so prefer the doubled tempo when it is almost as strong
    if (bestBpm < 90 && scoreAt(bestBpm * 2) >= bestScore * 0.7) {
      return bestBpm * 2;
    }
    return bestBpm;
  }

  private buildBeats(onset: number[], bpm: number, durationSec: number): number[] {
    const beatLen = 60 / bpm;
    const lagFrames = Math.max(1, Math.round(beatLen / this.frameSec));

    let bestOffset = 0;
    let bestScore = -Infinity;
    for (let offset = 0; offset < lagFrames; offset++) {
      let score = 0;
      for (let i = offset; i < onset.length; i += lagFrames) score += onset[i];
      if (score > bestScore) {
        bestScore = score;
        bestOffset = offset;
      }
    }

    const beats: number[] = [];
    for (let t = bestOffset * this.frameSec; t < durationSec; t += beatLen) {
      beats.push(Number(t.toFixed(3)));
    }
    return beats;
  }

  // One bar = 4 beats; energy is scaled so the loudest bar is 1
  private energyPerBar(rms: number[], beats: number[]) {
    const bars: { startSec: number; endSec: number; energy: number }[] = [];
    for (let b = 0; b + 4 < beats.length; b += 4) {
      const startSec = beats[b];
      const endSec = beats[b + 4];
      const slice = rms.slice(
        Math.floor(startSec / this.frameSec),
        Math.floor(endSec / this.frameSec),
      );
      const energy = slice.reduce((a, v) => a + v, 0) / (slice.length || 1);
      bars.push({ startSec, endSec, energy });
    }
    const max = Math.max(...bars.map((bar) => bar.energy), 0.0001);
    return bars.map((bar) => ({
      ...bar,
      energy: Number((bar.energy / max).toFixed(2)),
    }));
  }

  private findPeakWindow(
    bars: { startSec: number; endSec: number; energy: number }[],
    durationSec: number,
    windowSec = 15,
  ) {
    let best = { startSec: 0, endSec: Math.min(windowSec, durationSec), avg: -1 };
    for (const bar of bars) {
      const windowEnd = Math.min(bar.startSec + windowSec, durationSec);
      const inWindow = bars.filter((b) => b.startSec >= bar.startSec && b.endSec <= windowEnd);
      if (inWindow.length === 0) continue;
      const avg = inWindow.reduce((a, b) => a + b.energy, 0) / inWindow.length;
      if (avg > best.avg) {
        best = { startSec: bar.startSec, endSec: windowEnd, avg };
      }
    }
    return { ...best, avg: Number(best.avg.toFixed(2)) };
  }

  private analyseMusic = async (source: string) => {
    console.log("[Music] Decoding:", source);
    const samples = await this.decodeToSamples(source);
    const durationSec = samples.length / this.SAMPLE_RATE;
    console.log("[Music] Decoded:", { samples: samples.length, durationSec });
    if (samples.length < this.WINDOW * 2) {
      throw new Error("Soundtrack is too short or could not be decoded");
    }

    const rms = this.loudnessCurve(samples);
    const onset = this.onsetStrength(rms);
    const bpm = this.estimateBpm(onset);
    const beats = this.buildBeats(onset, bpm, durationSec);
    const bars = this.energyPerBar(rms, beats);
    const peak = this.findPeakWindow(bars, durationSec);
    console.log("[Music] Analysis done:", {
      frames: rms.length,
      bpm,
      beats: beats.length,
      bars: bars.length,
      peak,
    });

    return { durationSec: Number(durationSec.toFixed(2)), bpm, beats, bars, peak };
  };

  // Media rows hold either a CDN URL or an S3 key; Remotion needs a full URL
  private toCdnUrl = (value: string) =>
    /^https?:\/\//.test(value) ? value : new AWS().getImages(value).data;

  // Turns each saved analysisResult into reel clips; rows without a usable result are skipped
  private loadClips = async (memoryId: number, places: string[]) => {
    const clips: IReelClip[] = [];
    const reader = new ReadMemories();
    for (const place of places) {
      const tag = place.split(",")[0];
      const response = await reader.fetchVisualMediaInMemory(memoryId, tag);
      if (!response.success) continue;

      for (const media of response.data ?? []) {
        if (!media.analysisResult) continue;
        let result: any;
        try {
          result = JSON.parse(media.analysisResult);
        } catch {
          continue;
        }

        if (media.type === "pic" && result?.ai) {
          if ((result.ai.reelScore ?? 0) < 4) continue;
          clips.push({
            id: `p${media.id}`,
            mediaId: media.id,
            kind: "photo",
            place,
            url: this.toCdnUrl(media.url),
            score: result.ai.reelScore,
            storyRoles: result.ai.storyRoles ?? [],
            description: result.ai.description ?? "",
            focalPoint: result.ai.focalPoint,
          });
        } else if (media.type === "video" && Array.isArray(result?.segments)) {
          result.segments.forEach((segment: any, n: number) => {
            clips.push({
              id: `v${media.id}-${n}`,
              mediaId: media.id,
              kind: "video",
              place,
              url: this.toCdnUrl(media.url),
              score: 6,
              storyRoles: segment.storyRoles ?? [],
              description: segment.description ?? "",
              sourceStart: segment.start,
              sourceEnd: segment.end,
            });
          });
        }
      }
    }
    console.log("[Reel pipeline] Clips loaded:", {
      photos: clips.filter((clip) => clip.kind === "photo").length,
      videoSegments: clips.filter((clip) => clip.kind === "video").length,
    });
    return clips;
  };

  // Keeps the AI prompt small: when there are too many clips, drop the lowest scores
  private limitClips = (clips: IReelClip[]) => {
    if (clips.length <= MAX_CLIPS_FOR_AI) return clips;
    const keep = new Set([...clips].sort((a, b) => b.score - a.score).slice(0, MAX_CLIPS_FOR_AI));
    return clips.filter((clip) => keep.has(clip));
  };

  // The song name helps the AI recall the song's feel; random upload names (uuid, numbers) are ignored
  private songTitle = (data: IMemoriesReelCreation, audioUrl?: string) => {
    const given = data.soundtrackTitle?.trim();
    if (given) return given;
    const base = (audioUrl ? new URL(audioUrl).pathname : "").split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
    const title = base.replace(/[_-]+/g, " ").trim();
    if (!title || /^[0-9a-f\s]{16,}$/i.test(title) || /^\d+$/.test(title)) return null;
    return title;
  };

  // Compact view of the song for the AI: a few energy sections instead of every bar
  private summariseMusic = (
    music: IMusicAnalysis | undefined,
    grid: { times: number[]; beatSec: number; musicStart: number },
    title: string | null,
  ) => {
    const usableSeconds = grid.times.length ? grid.times[grid.times.length - 1] : 0;
    if (!music) {
      return {
        title,
        songSeconds: 0,
        reelStartsAtSec: 0,
        bpm: 120,
        beatSeconds: grid.beatSec,
        usableSeconds,
        sections: [],
        peak: null,
      };
    }
    const bars = music.bars
      .map((bar) => ({
        startSec: bar.startSec - grid.musicStart,
        endSec: bar.endSec - grid.musicStart,
        energy: bar.energy,
      }))
      .filter((bar) => bar.endSec <= usableSeconds + 0.001);
    const size = Math.max(1, Math.ceil(bars.length / 8));
    const sections: { startSec: number; endSec: number; energy: number }[] = [];
    for (let i = 0; i < bars.length; i += size) {
      const chunk = bars.slice(i, i + size);
      sections.push({
        startSec: Number(chunk[0].startSec.toFixed(1)),
        endSec: Number(chunk[chunk.length - 1].endSec.toFixed(1)),
        energy: Number((chunk.reduce((sum, bar) => sum + bar.energy, 0) / chunk.length).toFixed(2)),
      });
    }
    const peakStart = music.peak.startSec - grid.musicStart;
    const peak =
      peakStart >= 0 && peakStart < usableSeconds
        ? {
            startSec: Number(peakStart.toFixed(1)),
            endSec: Number(Math.min(music.peak.endSec - grid.musicStart, usableSeconds).toFixed(1)),
          }
        : null;
    return {
      title,
      songSeconds: Number(music.durationSec.toFixed(1)),
      reelStartsAtSec: Number(grid.musicStart.toFixed(1)),
      bpm: music.bpm,
      beatSeconds: Number(grid.beatSec.toFixed(3)),
      usableSeconds: Number(usableSeconds.toFixed(1)),
      sections,
      peak,
    };
  };

  createReelPipeLine = async (reelCreationData: IMemoriesReelCreation) => {
    try {
      console.log("[Reel pipeline] Started:", { memoryId: reelCreationData.memoryId, template: reelCreationData.template });
      const warnings: string[] = [];
      if (reelCreationData.template !== "Journey") {
        warnings.push(`Template "${reelCreationData.template}" is not built yet; the Journey layout was used.`);
      }

      // 1. Music: beats, BPM and energy
      let music: IMusicAnalysis | undefined;
      let audioUrl: string | undefined;
      if (reelCreationData.soundtrack) {
        audioUrl = resolveMusicUrl(reelCreationData.soundtrack);
        const dir = await mkdtemp(path.join(os.tmpdir(), "reel-music-"));
        try {
          const musicPath = path.join(dir, "soundtrack");
          console.log("[Music] Downloading soundtrack from configured CDN");
          await downloadMusic(audioUrl, musicPath);
          music = await this.analyseMusic(musicPath);
        } finally {
          await rm(dir, { recursive: true, force: true });
        }
      } else {
        console.log("[Reel pipeline] No soundtrack given; using fixed-length cuts");
      }

      // 2. Photos and videos with their saved analysis
      const clips = this.limitClips(await this.loadClips(reelCreationData.memoryId, reelCreationData.place));
      const targetSeconds = reelCreationData.targetSeconds ?? DEFAULT_TARGET_SECONDS;
      // A 3-minute song and a 40s reel: choose which part of the song the reel uses
      const musicStartSec = music
        ? chooseMusicStart(music, targetSeconds.max, reelCreationData.musicStartSec)
        : 0;
      const grid = beatGrid(music, targetSeconds.max, musicStartSec);
      const songTitle = this.songTitle(reelCreationData, audioUrl);
      console.log("[Reel pipeline] Beat grid:", {
        songTitle,
        songSeconds: music?.durationSec,
        musicStartSec,
        reelStartsAt: grid.musicStart,
        beats: grid.times.length,
        beatSec: grid.beatSec,
        targetSeconds,
      });

      // 3. AI reads the music + photo + video analysis and picks the best moments;
      //    if it fails, code picks instead
      let direction;
      if (clips.length > 0) {
        try {
          direction = await new ReelDirectorAgent().direct({
            template: reelCreationData.template,
            mood: reelCreationData.mood,
            pace: reelCreationData.pace,
            places: reelCreationData.place,
            userSuggestion: reelCreationData.userSuggestion,
            targetSeconds,
            music: this.summariseMusic(music, grid, songTitle),
            clips: clips.map((clip) => ({
              id: clip.id,
              place: clip.place,
              kind: clip.kind,
              score: clip.score,
              storyRoles: clip.storyRoles,
              description: clip.description,
              segmentSeconds:
                clip.sourceStart !== undefined && clip.sourceEnd !== undefined
                  ? Number((clip.sourceEnd - clip.sourceStart).toFixed(1))
                  : undefined,
            })),
          });
        } catch (error) {
          console.error("[Reel pipeline] AI direction failed, using fallback picker:", error);
          warnings.push("AI selection failed; clips were picked by score instead.");
        }
      }

      // 4. Snap to the beat grid and produce the Remotion script
      const script = buildReelScript({
        template: reelCreationData.template,
        mood: reelCreationData.mood,
        pace: reelCreationData.pace,
        places: reelCreationData.place,
        clips,
        music,
        audioUrl,
        direction,
        targetSeconds,
        musicStartSec,
        warnings,
      });
      console.log("[Reel pipeline] Script built:", {
        title: script.title,
        scenes: script.scenes.length,
        durationSec: script.durationSec,
        pickedBy: script.pickedBy,
        warnings: script.warnings,
      });

      return { success: true, data: { script, music } };
    } catch (error) {
      console.error("[Reel pipeline] Failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Reel pipeline failed.",
      };
    }
  };
}
