import { z } from "zod";

export const videoMomentsSchema = z.object({
    segments: z.array(z.object({
        start: z.number().finite().nonnegative(),
        end: z.number().finite().positive(),
        description: z.string().trim().min(1),
        storyRoles: z.array(z.enum(["opening", "journey", "highlight", "detail", "ending"])).min(1),
    }).strict()).max(5),
}).strict();

export type VideoMoment = z.infer<typeof videoMomentsSchema>["segments"][number];

export interface IVideoFrame {
    path: string;
    timestamp: number;
}

export interface IVideoMetadata {
    duration: number;
    width: number;
    height: number;
    rotation: number;
    hasAudio: boolean;
}

export function parseVideoMoments(content: string, start: number, end: number): VideoMoment[] {
    const result = videoMomentsSchema.parse(JSON.parse(content));
    for (const segment of result.segments) {
        if (segment.start < start || segment.end > end || segment.start >= segment.end ||
            segment.end - segment.start > 12) {
            throw new Error(`Segment must fit within ${start}-${end}s and last at most 12 seconds`);
        }
    }
    return result.segments;
}