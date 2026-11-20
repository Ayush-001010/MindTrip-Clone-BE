export interface IMusicAnalysis {
  durationSec: number;
  bpm: number;
  beats: number[];
  bars: { startSec: number; endSec: number; energy: number }[];
  peak: { startSec: number; endSec: number; avg: number };
}

export interface IReelClip {
  // "p<mediaId>" for photos, "v<mediaId>-<n>" for video segments
  id: string;
  mediaId: number;
  kind: "photo" | "video";
  place: string;
  url: string;
  score: number;
  storyRoles: string[];
  description: string;
  focalPoint?: { x: number; y: number };
  // Only for videos: the usable range inside the source file
  sourceStart?: number;
  sourceEnd?: number;
}

export interface IReelScene {
  index: number;
  clipId: string;
  type: "photo" | "video";
  mediaId: number;
  place: string;
  src: string;
  startSec: number;
  endSec: number;
  // Frames at the script fps, ready for <Sequence from durationInFrames>
  fromFrame: number;
  durationInFrames: number;
  // Video only: the part of the source file to play
  trimStartSec?: number;
  trimEndSec?: number;
  // Video only: 1 normally; below 1 when the good moment is shorter than the scene
  playbackRate?: number;
  focalPoint?: { x: number; y: number };
  motion?: "zoom-in" | "zoom-out";
  caption?: string;
  reason: string;
}

// The reel body the frontend feeds into Remotion
export interface IReelScript {
  version: number;
  title: string;
  template: string;
  mood: string;
  pace: string;
  fps: number;
  width: number;
  height: number;
  durationSec: number;
  durationInFrames: number;
  audio: { src: string; startFromSec: number; bpm: number } | null;
  scenes: IReelScene[];
  pickedBy: "ai" | "fallback";
  warnings: string[];
}
