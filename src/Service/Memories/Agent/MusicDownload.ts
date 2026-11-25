import axios from "axios";
import { createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const MAX_MUSIC_BYTES = 200 * 1024 * 1024;

export function resolveMusicUrl(value: string): string {
  const domain = process.env.AWS_CloudFront_Domain;
  if (!domain) throw new Error("AWS_CloudFront_Domain is required for music downloads");
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A music CDN URL or S3 key is required");
  }
  const origin = new URL(`https://${domain}`);
  const url = new URL(value, `${origin.origin}/`);
  if (url.protocol !== "https:" || url.host !== origin.host || url.username || url.password) {
    throw new Error("Music URL must belong to the configured HTTPS CDN");
  }
  return url.href;
}

export async function downloadMusic(url: string, filePath: string): Promise<void> {
  await downloadMediaFile(url, filePath, MAX_MUSIC_BYTES, "Music");
}

export async function downloadMediaFile(url: string, filePath: string, maxBytes: number, label: string): Promise<void> {
  const signal = AbortSignal.timeout(5 * 60 * 1000);
  const response = await axios.get<Readable>(url, {
    responseType: "stream",
    timeout: 60000,
    signal,
    maxRedirects: 0,
  });
  const limitError = `${label} exceeds the ${maxBytes / 1024 / 1024} MB download limit`;
  if (Number(response.headers["content-length"]) > maxBytes) {
    response.data.destroy();
    throw new Error(limitError);
  }
  let bytes = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length;
      callback(bytes > maxBytes ? new Error(limitError) : null, chunk);
    },
  });
  await pipeline(response.data, limiter, createWriteStream(filePath, { flags: "wx" }), { signal });
  if (!bytes) throw new Error(`Downloaded ${label.toLowerCase()} is empty`);
}
