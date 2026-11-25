import { z } from "zod";

// What the AI director returns: which clips, in which order, and for how many beats each.
// Code snaps the scenes to the real beat times, so the AI never writes timestamps.
export const reelDirectionSchema = z.object({
  title: z.string().min(1).max(60),
  scenes: z
    .array(
      z.object({
        clipId: z.string().min(1),
        beats: z.number().int().min(1).max(16),
        caption: z.string().max(40).optional(),
        reason: z.string().min(1).max(160),
      }),
    )
    .min(1),
});

export type ReelDirection = z.infer<typeof reelDirectionSchema>;

export const reelDirectorResponseSchema = reelDirectionSchema.extend({
  musicWindowId: z.string().min(1),
});

export type ReelDirectorResponse = z.infer<typeof reelDirectorResponseSchema>;

export interface IReelMusicWindow {
  id: string;
  reelStartsAtSec: number;
  beatTimes: number[];
  usableSeconds: number;
  sections: { startSec: number; endSec: number; energy: number }[];
  peak: { startSec: number; endSec: number } | null;
  transcript: { startSec: number; endSec: number; text: string }[];
}

export interface IReelDirectorInput {
  template: string;
  mood: string;
  pace: string;
  places: string[];
  userSuggestion?: string;
  targetSeconds: { min: number; max: number };
  music: {
    // Name of the song, so the model can use what it knows about its feel; null when unknown
    title: string | null;
    songSeconds: number;
    bpm: number;
    beatSeconds: number;
    windows: IReelMusicWindow[];
  };
  clips: {
    id: string;
    place: string;
    kind: "photo" | "video";
    score: number;
    storyRoles: string[];
    description: string;
    segmentSeconds?: number;
  }[];
}
