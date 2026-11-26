import { IMusicAnalysis, IReelClip, IReelScene, IReelScript } from "../../Interface/DataInterface/IReelPlan";
import { ReelDirection } from "../../Interface/DataInterface/IReelDirection";

export type Pace = "Slow" | "Medium" | "Fast";

export const MIN_SCENE_SEC: Record<Pace, number> = { Slow: 3, Medium: 2, Fast: 1 };
export const DEFAULT_TARGET_SECONDS = { min: 30, max: 40 };
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

// Beat times in seconds from the first beat at or after startSec, up to maxSec; a 120 BPM grid when there is no music
export function beatGrid(music: IMusicAnalysis | undefined, maxSec: number, startSec = 0) {
  if (!music || music.beats.length < 2) {
    const beatSec = 0.5;
    return {
      times: Array.from({ length: Math.floor(maxSec / beatSec) + 1 }, (_, i) => i * beatSec),
      beatSec,
      musicStart: 0,
    };
  }
  const musicStart = music.beats.find((t) => t >= startSec) ?? music.beats[0];
  const limit = Math.min(music.durationSec, musicStart + maxSec);
  return {
    times: music.beats.filter((t) => t >= musicStart && t <= limit).map((t) => Number((t - musicStart).toFixed(3))),
    beatSec: 60 / music.bpm,
    musicStart,
  };
}

// A song is usually longer than the reel. Without a request from the user, use the stretch of
// the song (starting on a bar) with the highest average energy, so the reel gets the chorus
// and not just the intro.
export function chooseMusicStart(music: IMusicAnalysis, windowSec: number, requested?: number) {
  if (requested !== undefined && requested >= 0) return requested;
  if (music.durationSec - music.beats[0] <= windowSec || music.bars.length === 0) return 0;

  let best = { start: 0, avg: -1 };
  for (const bar of music.bars) {
    if (bar.startSec + windowSec > music.durationSec) break;
    const inside = music.bars.filter((b) => b.startSec >= bar.startSec && b.endSec <= bar.startSec + windowSec);
    if (inside.length === 0) continue;
    const avg = inside.reduce((sum, b) => sum + b.energy, 0) / inside.length;
    if (avg > best.avg) best = { start: bar.startSec, avg };
  }
  return best.start;
}

export function candidateMusicStarts(music: IMusicAnalysis | undefined, windowSec: number, requested?: number) {
  if (!music) return [0];
  if (requested !== undefined) return [requested];
  const fallback = chooseMusicStart(music, windowSec);
  const lastBeat = music.beats[music.beats.length - 1] ?? 0;
  const starts = music.bars.filter(bar => bar.startSec + windowSec <= lastBeat).map(bar => bar.startSec);
  if (!starts.length) return [fallback];
  // Sample across the song so the director can compare quiet and energetic passages.
  const sampled = Array.from({ length: 5 }, (_, i) => starts[Math.round(i * (starts.length - 1) / 4)]);
  return [...new Set([fallback, ...sampled])];
}

// Equal-length slots on the beat grid for the code-only picker
export function buildSlots(pace: Pace, times: number[], beatSec: number) {
  const beatsPerScene = Math.max(1, Math.ceil(MIN_SCENE_SEC[pace] / beatSec));
  const slots: [number, number][] = [];
  for (let i = 0; i + beatsPerScene < times.length; i += beatsPerScene) {
    slots.push([times[i], times[i + beatsPerScene]]);
  }
  return slots;
}

// Plays only a slot-long window from the middle of the analysed segment, where the moment is
// at its fullest; the start usually has the camera settling. A segment shorter than the slot
// is played whole, slowed down just enough to fill it (never below half speed).
function pickMoment(clip: IReelClip, slotSec: number) {
  const segStart = clip.sourceStart ?? 0;
  const segEnd = clip.sourceEnd ?? segStart + slotSec;
  const segLen = segEnd - segStart;
  if (segLen <= slotSec) {
    return {
      start: Number(segStart.toFixed(3)),
      end: Number(segEnd.toFixed(3)),
      playbackRate: Math.max(0.5, segLen / slotSec),
    };
  }
  const start = segStart + (segLen - slotSec) / 2;
  return { start: Number(start.toFixed(3)), end: Number((start + slotSec).toFixed(3)), playbackRate: 1 };
}

// Opening shots first, strongest next, endings last
function sortWithinPlace(clips: IReelClip[]) {
  const rank = (clip: IReelClip) => {
    if (clip.storyRoles.includes("opening")) return 0;
    if (clip.storyRoles.includes("ending")) return 2;
    return 1;
  };
  return [...clips].sort((a, b) => rank(a) - rank(b) || b.score - a.score);
}

// Code-only picker, used when the AI fails: every place gets a share of the slots in route order
function pickWithoutAi(places: string[], clips: IReelClip[], slotCount: number) {
  const groups = places
    .map((place) => sortWithinPlace(clips.filter((clip) => clip.place === place)))
    .filter((group) => group.length > 0);
  const total = groups.reduce((sum, group) => sum + group.length, 0);
  const target = Math.min(slotCount, total);

  const quota = groups.map((_, i) => i < target ? 1 : 0);
  let used = Math.min(groups.length, target);
  while (used < target) {
    let pick = -1;
    let spare = 0;
    groups.forEach((group, i) => {
      if (group.length - quota[i] > spare) {
        spare = group.length - quota[i];
        pick = i;
      }
    });
    if (pick === -1) break;
    quota[pick]++;
    used++;
  }

  return groups.flatMap((group, i) => {
    const keep = new Set([...group].sort((a, b) => b.score - a.score).slice(0, quota[i]));
    return group.filter((clip) => keep.has(clip)).map((clip) => ({ clip, caption: undefined as string | undefined, reason: clip.description }));
  });
}

export interface IReelScriptInput {
  template: string;
  mood: string;
  pace: Pace;
  places: string[];
  clips: IReelClip[];
  music?: IMusicAnalysis;
  audioUrl?: string;
  direction?: ReelDirection;
  targetSeconds?: { min: number; max: number };
  // Where in the song the reel starts; the builder uses the same value as the AI call
  musicStartSec?: number;
  warnings?: string[];
}

export function buildReelScript(input: IReelScriptInput): IReelScript {
  const warnings = [...(input.warnings ?? [])];
  const target = input.targetSeconds ?? DEFAULT_TARGET_SECONDS;
  const { times, beatSec, musicStart } = beatGrid(input.music, target.max, input.musicStartSec);

  let picked: { clip: IReelClip; caption?: string; reason: string; slot: [number, number] }[] = [];
  if (input.direction) {
    // The AI chose the clips and how many beats each lasts; place them back to back on the beats
    const byId = new Map(input.clips.map((clip) => [clip.id, clip]));
    let cursor = 0;
    for (const scene of input.direction.scenes) {
      if (cursor >= times.length - 1) break;
      const end = Math.min(cursor + scene.beats, times.length - 1);
      picked.push({
        clip: byId.get(scene.clipId)!,
        caption: scene.caption,
        reason: scene.reason,
        slot: [times[cursor], times[end]],
      });
      cursor = end;
    }
  } else {
    const slots = buildSlots(input.pace, times, beatSec);
    const beatsPerScene = Math.max(1, Math.ceil(MIN_SCENE_SEC[input.pace] / beatSec));
    const selected = pickWithoutAi(input.places, input.clips, slots.length);
    const selectedClips = new Set(selected.map(item => item.clip));
    const remaining = pickWithoutAi(input.places, input.clips.filter(clip => !selectedClips.has(clip)), input.clips.length);
    let cursor = 0;
    for (const item of [...selected, ...remaining]) {
      if (picked.length >= slots.length || cursor >= times.length - 1) break;
      let end = Math.min(cursor + beatsPerScene, times.length - 1);
      if (item.clip.kind === "video" && item.clip.sourceStart !== undefined && item.clip.sourceEnd !== undefined) {
        const segmentSec = item.clip.sourceEnd - item.clip.sourceStart;
        while (end > cursor && times[end] - times[cursor] > segmentSec * 2 + 0.001) end--;
        if (end === cursor) {
          warnings.push(`Skipped video ${item.clip.id}: its segment is too short for a beat.`);
          continue;
        }
      }
      picked.push({ ...item, slot: [times[cursor], times[end]] });
      cursor = end;
    }
  }
  if (picked.length === 0) warnings.push("No usable media to build a reel.");

  const scenes: IReelScene[] = picked.map(({ clip, caption, reason, slot }, index) => {
    const [startSec, endSec] = slot;
    const fromFrame = Math.round(startSec * FPS);
    const trim = clip.kind === "video" ? pickMoment(clip, endSec - startSec) : undefined;
    return {
      index,
      clipId: clip.id,
      type: clip.kind,
      mediaId: clip.mediaId,
      place: clip.place,
      src: clip.url,
      startSec: Number(startSec.toFixed(3)),
      endSec: Number(endSec.toFixed(3)),
      fromFrame,
      durationInFrames: Math.round(endSec * FPS) - fromFrame,
      trimStartSec: trim?.start,
      trimEndSec: trim?.end,
      playbackRate: trim?.playbackRate,
      focalPoint: clip.focalPoint,
      // Alternate the direction so photos don't all move the same way
      motion: clip.kind === "photo" ? (index % 2 === 0 ? "zoom-in" : "zoom-out") : undefined,
      caption,
      reason,
    };
  });

  const durationSec = scenes.length ? scenes[scenes.length - 1].endSec : 0;
  if (scenes.length && durationSec < target.min * 0.8) {
    warnings.push(`Reel is ${durationSec.toFixed(1)}s, shorter than the ${target.min}s target (not enough good media or song).`);
  }
  return {
    version: 1,
    title: input.direction?.title ?? "My Trip",
    template: input.template,
    mood: input.mood,
    pace: input.pace,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    durationSec,
    durationInFrames: Math.round(durationSec * FPS),
    audio:
      input.music && input.audioUrl
        ? { src: input.audioUrl, startFromSec: Number(musicStart.toFixed(3)), bpm: input.music.bpm }
        : null,
    scenes,
    pickedBy: input.direction ? "ai" : "fallback",
    warnings,
  };
}
