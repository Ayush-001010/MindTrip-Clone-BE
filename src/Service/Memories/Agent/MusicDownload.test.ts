import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import axios, { AxiosAdapter } from "axios";
import { downloadMusic, resolveMusicUrl } from "./MusicDownload";

test("music URLs accept the configured CDN and S3 keys but reject other origins", () => {
  const previous = process.env.AWS_CloudFront_Domain;
  process.env.AWS_CloudFront_Domain = "cdn.example.com";
  try {
    const signedUrl = "https://cdn.example.com/music/song.mp3?Signature=abc";
    assert.equal(resolveMusicUrl(signedUrl), signedUrl);
    assert.equal(resolveMusicUrl("music/song.mp3"), "https://cdn.example.com/music/song.mp3");
    for (const url of ["https://other.example/song.mp3", "http://cdn.example.com/song.mp3", "https://user@cdn.example.com/song.mp3", "file:///etc/passwd"]) {
      assert.throws(() => resolveMusicUrl(url), /configured HTTPS CDN/);
    }
  } finally {
    if (previous === undefined) delete process.env.AWS_CloudFront_Domain;
    else process.env.AWS_CloudFront_Domain = previous;
  }
});

test("music downloads preserve the URL, disable redirects, and reject empty responses", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "music-download-test-"));
  const previous = axios.defaults.adapter;
  let empty = false;
  let maxRedirects: number | undefined;
  let receivedUrl: string | undefined;
  const adapter: AxiosAdapter = async (config) => {
    maxRedirects = config.maxRedirects;
    receivedUrl = config.url;
    return {
      data: Readable.from(empty ? [] : [Buffer.from("sound")]),
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  axios.defaults.adapter = adapter;
  try {
    const url = "https://cdn.example.com/song.mp3?Signature=abc";
    const file = path.join(dir, "song");
    await downloadMusic(url, file);
    assert.equal(receivedUrl, url);
    assert.equal(maxRedirects, 0);
    assert.equal((await readFile(file)).toString(), "sound");
    empty = true;
    await assert.rejects(downloadMusic(url, path.join(dir, "empty")), /music is empty/i);
  } finally {
    axios.defaults.adapter = previous;
    await rm(dir, { recursive: true, force: true });
  }
});
