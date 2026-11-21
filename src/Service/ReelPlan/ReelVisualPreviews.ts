import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { IReelClip } from "../../Interface/DataInterface/IReelPlan";
import { downloadMediaFile, resolveMusicUrl } from "../Memories/Agent/MusicDownload";

const execFileAsync = promisify(execFile);
const MAX_TILES = 8;
const WIDTH = 320;
const HEIGHT = 240;
const LABEL_HEIGHT = 24;
const BACKGROUND = "#111";
const MB = 1024 * 1024;

export interface ReelPreviewSheet {
  image: Buffer;
  clipIds: string[];
}

async function tile(source: string | Buffer, clipId: string, time?: number) {
  const safeId = clipId.replace(/[^a-zA-Z0-9-]/g, "_");
  const text = time === undefined ? `${safeId} | photo` : `${safeId} | ${time.toFixed(3)}s`;
  const label = Buffer.from(
    `<svg width="${WIDTH}" height="${LABEL_HEIGHT}"><rect width="100%" height="100%" fill="${BACKGROUND}"/>` +
    `<text x="8" y="17" font-size="15" fill="white">${text}</text></svg>`,
  );
  const image = await sharp(source).rotate()
    .resize(WIDTH, HEIGHT - LABEL_HEIGHT, { fit: "contain", background: BACKGROUND }).jpeg().toBuffer();
  return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: BACKGROUND } })
    .composite([{ input: image, top: 0, left: 0 }, { input: label, top: HEIGHT - LABEL_HEIGHT, left: 0 }])
    .jpeg().toBuffer();
}

async function sheet(tiles: { image: Buffer; clipId: string }[]): Promise<ReelPreviewSheet> {
  const columns = Math.min(3, tiles.length);
  const image = await sharp({
    create: { width: columns * WIDTH, height: Math.ceil(tiles.length / columns) * HEIGHT, channels: 3, background: BACKGROUND },
  }).composite(tiles.map(({ image: input }, i) => ({
    input, left: (i % columns) * WIDTH, top: Math.floor(i / columns) * HEIGHT,
  }))).jpeg({ quality: 80 }).toBuffer();
  return { image, clipIds: [...new Set(tiles.map(item => item.clipId))] };
}

async function previewClip(file: string, clip: IReelClip): Promise<Buffer[]> {
  if (clip.kind === "photo") return [await tile(file, clip.id)];

  const { sourceStart: start, sourceEnd: end } = clip;
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
    throw new Error("Video segment has invalid bounds");
  }
  const frames: Buffer[] = [];
  for (const fraction of [0.2, 0.5, 0.8]) {
    const time = start + (end - start) * fraction;
    const { stdout } = await execFileAsync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-nostdin", "-protocol_whitelist", "file,pipe",
      "-ss", String(time), "-i", file, "-map", "0:V:0", "-frames:v", "1",
      "-vf", "scale=512:512:force_original_aspect_ratio=decrease",
      "-c:v", "mjpeg", "-f", "image2pipe", "pipe:1",
    ], { encoding: "buffer", timeout: 30_000, maxBuffer: 2 * MB });
    if (stdout.length) frames.push(await tile(stdout, clip.id, time));
  }
  if (!frames.length) throw new Error("No video frames could be extracted");
  return frames;
}

export async function* reelVisualPreviews(
  clips: IReelClip[],
  onUnavailable: (clipId: string) => void,
): AsyncGenerator<ReelPreviewSheet> {
  const groups = new Map<number, IReelClip[]>();
  for (const clip of clips) {
    const group = groups.get(clip.mediaId);
    if (group) group.push(clip);
    else groups.set(clip.mediaId, [clip]);
  }

  let tiles: { image: Buffer; clipId: string }[] = [];
  for (const group of groups.values()) {
    const source = group[0];
    const dir = await mkdtemp(path.join(os.tmpdir(), "reel-preview-"));
    try {
      const file = path.join(dir, "media");
      try {
        await downloadMediaFile(resolveMusicUrl(source.url), file, (source.kind === "video" ? 500 : 25) * MB, "Reel media");
      } catch (error) {
        console.warn("[Reel previews] Download failed:", { mediaId: source.mediaId, error: error instanceof Error ? error.name : "UnknownError" });
        for (const clip of group) onUnavailable(clip.id);
        continue;
      }

      for (const clip of group) {
        let previews: Buffer[];
        try {
          previews = await previewClip(file, clip);
        } catch (error) {
          console.warn("[Reel previews] Could not create preview:", { clipId: clip.id, error: error instanceof Error ? error.name : "UnknownError" });
          onUnavailable(clip.id);
          continue;
        }
        if (tiles.length + previews.length > MAX_TILES) {
          yield await sheet(tiles);
          tiles = [];
        }
        tiles.push(...previews.map(image => ({ image, clipId: clip.id })));
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  if (tiles.length) yield await sheet(tiles);
}
