import assert from "node:assert/strict";
import test from "node:test";
import { IMusicAnalysis, IReelClip } from "../../Interface/DataInterface/IReelPlan";
import { beatGrid, buildReelScript, chooseMusicStart } from "./ReelScriptBuilder";

const beats = Array.from({ length: 80 }, (_, i) => Number((0.25 + i * 0.5).toFixed(3)));
const music: IMusicAnalysis = {
  durationSec: 40,
  bpm: 120,
  beats,
  bars: [],
  peak: { startSec: 0, endSec: 15, avg: 1 },
};

const clip = (id: string, place: string, score: number, roles: string[] = []): IReelClip => ({
  id,
  mediaId: Number(id.replace(/\D/g, "")),
  kind: id.startsWith("v") ? "video" : "photo",
  place,
  url: `https://cdn/${id}`,
  score,
  storyRoles: roles,
  description: id,
});

test("scenes land on beats and use frames at 30fps", () => {
  const script = buildReelScript({
    template: "Journey",
    mood: "Happy",
    pace: "Medium",
    places: ["Manali", "Jibhi"],
    clips: [clip("p1", "Manali", 8, ["opening"]), clip("p2", "Jibhi", 7)],
    music,
    audioUrl: "https://cdn/song.mp3",
  });

  assert.equal(script.pickedBy, "fallback");
  assert.equal(script.audio?.startFromSec, 0.25);
  assert.deepEqual(script.scenes.map((scene) => scene.place), ["Manali", "Jibhi"]);
  // Medium = at least 2s; at 120 BPM that is 4 beats = 2s
  assert.equal(script.scenes[0].startSec, 0);
  assert.equal(script.scenes[0].endSec, 2);
  assert.equal(script.scenes[1].fromFrame, 60);
  assert.equal(script.scenes[1].durationInFrames, 60);
});

test("AI direction can reorder places and decides each scene length in beats", () => {
  const script = buildReelScript({
    template: "Journey",
    mood: "Happy",
    pace: "Slow",
    places: ["Manali", "Jibhi"],
    clips: [clip("p1", "Manali", 8), clip("v2-0", "Jibhi", 6)],
    music,
    direction: {
      title: "Hills",
      scenes: [
        { clipId: "v2-0", beats: 2, reason: "movement" },
        { clipId: "p1", beats: 6, reason: "view", caption: "Manali" },
      ],
    },
  });

  assert.equal(script.pickedBy, "ai");
  assert.equal(script.title, "Hills");
  assert.deepEqual(script.scenes.map((scene) => scene.clipId), ["v2-0", "p1"]);
  assert.deepEqual(script.scenes.map((scene) => scene.place), ["Jibhi", "Manali"]);
  // 120 BPM: 2 beats = 1s, then 6 beats = 3s, back to back
  assert.deepEqual(script.scenes.map((scene) => [scene.startSec, scene.endSec]), [[0, 1], [1, 4]]);
  assert.equal(script.scenes[1].caption, "Manali");
  assert.equal(script.scenes[0].motion, undefined);
  assert.equal(script.scenes[1].motion, "zoom-out");
});

test("the reel is cut at the target maximum and unused clips are left out", () => {
  const script = buildReelScript({
    template: "Journey",
    mood: "Happy",
    pace: "Medium",
    places: ["Manali"],
    clips: [clip("p1", "Manali", 8), clip("p2", "Manali", 7), clip("p3", "Manali", 6), clip("p4", "Manali", 5)],
    music,
    targetSeconds: { min: 2, max: 3 },
    direction: {
      title: "T",
      scenes: ["p1", "p2", "p3"].map((clipId) => ({ clipId, beats: 4, reason: "r" })),
    },
  });

  assert.deepEqual(script.scenes.map((scene) => scene.clipId), ["p1", "p2"]);
  assert.equal(script.durationSec, 3);
});

test("videos are trimmed to a scene-long moment from the middle of the segment", () => {
  const long: IReelClip = { ...clip("v1-0", "Manali", 6), sourceStart: 10, sourceEnd: 20 };
  const short: IReelClip = { ...clip("v2-0", "Manali", 6), sourceStart: 5, sourceEnd: 6 };
  const script = buildReelScript({
    template: "Journey",
    mood: "Happy",
    pace: "Medium",
    places: ["Manali"],
    clips: [long, short],
    music,
    direction: {
      title: "T",
      scenes: [
        { clipId: "v1-0", beats: 4, reason: "a" },
        { clipId: "v2-0", beats: 4, reason: "b" },
      ],
    },
  });

  // 2s scene from a 10s segment: the middle 2s
  assert.equal(script.scenes[0].trimStartSec, 14);
  assert.equal(script.scenes[0].trimEndSec, 16);
  assert.equal(script.scenes[0].playbackRate, 1);
  // 1s segment in a 2s scene: whole segment at half speed
  assert.equal(script.scenes[1].trimStartSec, 5);
  assert.equal(script.scenes[1].trimEndSec, 6);
  assert.equal(script.scenes[1].playbackRate, 0.5);
});

test("a long song uses its most energetic stretch, starting on a bar", () => {
  const bars = Array.from({ length: 90 }, (_, i) => ({
    startSec: Number((0.25 + i * 2).toFixed(2)),
    endSec: Number((2.25 + i * 2).toFixed(2)),
    // quiet intro, loud chorus from bar 40 to 60 (80s to 120s)
    energy: i >= 40 && i < 60 ? 1 : 0.3,
  }));
  const long: IMusicAnalysis = {
    durationSec: 180,
    bpm: 120,
    beats: Array.from({ length: 360 }, (_, i) => Number((0.25 + i * 0.5).toFixed(3))),
    bars,
    peak: { startSec: 80, endSec: 95, avg: 1 },
  };

  const start = chooseMusicStart(long, 40);
  assert.equal(start, 80.25);
  assert.equal(chooseMusicStart(long, 40, 12), 12);

  const grid = beatGrid(long, 40, start);
  assert.equal(grid.musicStart, 80.25);
  assert.equal(grid.times[0], 0);
  assert.equal(grid.times[grid.times.length - 1], 40);

  // a song shorter than the reel just starts at the beginning
  assert.equal(chooseMusicStart(music, 40), 0);
});

test("no media gives an empty reel with a warning", () => {
  const script = buildReelScript({ template: "Journey", mood: "Happy", pace: "Fast", places: ["X"], clips: [] });
  assert.equal(script.scenes.length, 0);
  assert.ok(script.warnings.includes("No usable media to build a reel."));
});
