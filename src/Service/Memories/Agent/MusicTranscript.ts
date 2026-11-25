import axios from "axios";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import FormData from "form-data";
import { z } from "zod";

const execFileAsync = promisify(execFile);
const transcriptSchema = z.object({
  segments: z.array(z.object({
    start: z.number().nonnegative(),
    end: z.number().positive(),
    text: z.string(),
    no_speech_prob: z.number().min(0).max(1).optional(),
  })),
});

export async function transcribeMusic(source: string, dir: string, durationSec: number) {
  const endpoint = process.env.WHISPER_URL;
  if (!endpoint) throw new Error("WHISPER_URL is not configured");

  const wav = path.join(dir, "transcript.wav");
  await execFileAsync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-i", source,
    "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav,
  ], { timeout: 180_000 });

  const stream = createReadStream(wav);
  const form = new FormData();
  form.append("audio_file", stream);
  try {
    const response = await axios.post(`${endpoint.replace(/\/$/, "")}/asr`, form, {
      params: { task: "transcribe", output: "json" },
      headers: form.getHeaders(),
      timeout: 300_000,
      maxRedirects: 0,
      maxContentLength: 2 * 1024 * 1024,
    });
    return transcriptSchema.parse(response.data).segments.flatMap(segment => {
      const { start } = segment;
      const end = Math.min(segment.end, durationSec);
      const text = segment.text.trim().slice(0, 240);
      return text && end > start && (segment.no_speech_prob ?? 0) < 0.6
        ? [{ startSec: start, endSec: end, text }]
        : [];
    }).sort((a, b) => a.startSec - b.startSec);
  } finally {
    stream.destroy();
  }
}
