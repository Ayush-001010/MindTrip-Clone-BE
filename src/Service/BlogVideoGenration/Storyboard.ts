import { z } from "zod";

export const MIN_TOTAL_SECONDS = 10;
export const MAX_TOTAL_SECONDS = 50;
export const MIN_SCENE_SECONDS = 2;
export const MAX_SCENE_SECONDS = 4;
export const MAX_CAPTION_WORDS = 8;
export const INTRO_THUMBNAIL_ID = "intro";

const FocusSchema = z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
});

// Position of the scene along the blog's route (1-based). 0 means it belongs to no single stop (intro, outro).
const RouteStopSchema = z.number().int().min(0).default(0);

const ImageSceneSchema = z.object({
    media_id: z.string(),
    type: z.literal("image"),
    route_stop: RouteStopSchema,
    duration: z.number(),
    caption: z.string().default(""),
    motion: z.enum(["zoom_in", "zoom_out", "pan_left", "pan_right", "none"]).default("zoom_in"),
    transition: z.enum(["fade", "slide", "none"]).default("fade"),
    focus: FocusSchema.default({ x: 0.5, y: 0.5 }),
});

const VideoSceneSchema = z.object({
    media_id: z.string(),
    type: z.literal("video"),
    route_stop: RouteStopSchema,
    trimStart: z.number().min(0),
    trimEnd: z.number().min(0),
    keepAudio: z.boolean().default(true),
    caption: z.string().default(""),
    transition: z.enum(["fade", "slide", "none"]).default("fade"),
    reason: z.string().optional(),
});

// A user thumbnail shown as a title card. Its text always comes from the user, never from the AI.
const ThumbnailSceneSchema = z.object({
    type: z.literal("thumbnail"),
    thumbnail_id: z.string(),
    text: z.string().default(""),
    route_stop: RouteStopSchema,
    duration: z.number(),
    style: z.enum(["bold_center", "question", "stat", "quote", "versus", "action"]).default("bold_center"),
    background_media_ids: z.array(z.string()).default([]),
    text_position: z.enum(["top", "center", "bottom"]).default("center"),
    transition: z.enum(["fade", "slide", "none"]).default("fade"),
});

export const StoryboardSchema = z.object({
    title: z.string(),
    music_mood: z.string().default("upbeat"),
    total_duration: z.number().optional(),
    scenes: z.array(z.discriminatedUnion("type", [ImageSceneSchema, VideoSceneSchema, ThumbnailSceneSchema])).min(1),
});

export type Storyboard = z.infer<typeof StoryboardSchema>;
export type Scene = Storyboard["scenes"][number];

export interface IMediaInfo {
    media_id: string;
    type: "image" | "video";
    duration?: number; // seconds, required for videos
}

export interface IThumbnail {
    thumbnail_id: string;
    text: string;
    description: string;
}

// Turns the raw thumbnails sent by the FE into ids t1, t2, ... in the order received. Entries without text are ignored.
export const toThumbnails = (raw: unknown): IThumbnail[] => {
    if (!Array.isArray(raw)) return [];
    const list: IThumbnail[] = [];
    raw.forEach((item) => {
        const text = String(item?.text ?? "").trim();
        if (!text) return;
        list.push({
            thumbnail_id: `t${list.length + 1}`,
            text,
            description: String(item?.description ?? "").trim(),
        });
    });
    return list;
};

export const limitCaption = (caption: string): string => {
    const words = caption.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, MAX_CAPTION_WORDS).join(" ");
};

const sceneLength = (scene: Scene): number =>
    scene.type === "video" ? scene.trimEnd - scene.trimStart : scene.duration;

const round1 = (n: number) => Math.round(n * 10) / 10;

// Clamps every scene to 2-4s and the total to 30-40s without inventing media.
export const normalizeStoryboard = (
    storyboard: Storyboard,
    media: IMediaInfo[],
    thumbnails: IThumbnail[] = []
): Storyboard => {
    const mediaById = new Map(media.map((m) => [m.media_id, m]));
    const thumbnailById = new Map(thumbnails.map((t) => [t.thumbnail_id, t]));
    const usedThumbnails = new Set<string>();
    const clampDuration = (d: number) => Math.min(Math.max(d, MIN_SCENE_SECONDS), MAX_SCENE_SECONDS);

    const scenes: Scene[] = [];
    for (const scene of storyboard.scenes) {
        if (scene.type === "thumbnail") {
            const thumbnail = thumbnailById.get(scene.thumbnail_id);
            if (!thumbnail || usedThumbnails.has(scene.thumbnail_id)) continue;
            usedThumbnails.add(scene.thumbnail_id);
            const backgrounds = scene.background_media_ids
                .filter((id) => mediaById.get(id)?.type === "image")
                .slice(0, 2);
            const style = scene.style === "versus" && backgrounds.length < 2 ? "bold_center" : scene.style;
            scenes.push({
                ...scene,
                style,
                background_media_ids: backgrounds,
                text: thumbnail.text,
                duration: clampDuration(scene.duration),
            });
            continue;
        }

        const info = mediaById.get(scene.media_id);
        if (!info || info.type !== scene.type) continue;

        if (scene.type === "image") {
            scenes.push({
                ...scene,
                duration: clampDuration(scene.duration),
                caption: limitCaption(scene.caption),
            });
            continue;
        }

        const videoDuration = info.duration ?? Infinity;
        const start = Math.min(Math.max(scene.trimStart, 0), Math.max(videoDuration - MIN_SCENE_SECONDS, 0));
        let end = Math.min(Math.max(scene.trimEnd, start), videoDuration);
        end = Math.min(Math.max(end, start + MIN_SCENE_SECONDS), start + MAX_SCENE_SECONDS, videoDuration);
        scenes.push({
            ...scene,
            trimStart: round1(start),
            keepAudio: true,
            trimEnd: round1(end),
            caption: limitCaption(scene.caption),
        });
    }

    if (scenes.every((s) => s.type === "thumbnail")) {
        throw new Error("Storyboard has no scenes that match the uploaded media");
    }

    // The "Story Mode" card always opens the reel.
    const introIndex = scenes.findIndex((s) => s.type === "thumbnail" && s.thumbnail_id === INTRO_THUMBNAIL_ID);
    if (introIndex > 0) scenes.unshift(...scenes.splice(introIndex, 1));

    let total = scenes.reduce((sum, s) => sum + sceneLength(s), 0);

    // Too short: stretch scenes that still have room.
    for (let pass = 0; pass < 10 && total < MIN_TOTAL_SECONDS; pass++) {
        let grew = false;
        for (const scene of scenes) {
            if (total >= MIN_TOTAL_SECONDS) break;
            const room = MAX_SCENE_SECONDS - sceneLength(scene);
            if (room <= 0) continue;
            const add = Math.min(room, 1, MIN_TOTAL_SECONDS - total);
            if (scene.type === "video") {
                const videoDuration = mediaById.get(scene.media_id)?.duration ?? Infinity;
                const newEnd = Math.min(scene.trimEnd + add, videoDuration);
                if (newEnd <= scene.trimEnd) continue;
                scene.trimEnd = round1(newEnd);
            } else {
                scene.duration = round1(scene.duration + add);
            }
            total += add;
            grew = true;
        }
        if (!grew) break;
    }

    // Too long: drop media scenes from the end first so the user's thumbnails survive.
    while (total > MAX_TOTAL_SECONDS && scenes.length > 1) {
        let index = scenes.map((s) => s.type).lastIndexOf("image");
        if (index === -1) index = scenes.map((s) => s.type).lastIndexOf("video");
        if (index === -1) index = scenes.length - 1;
        total -= sceneLength(scenes.splice(index, 1)[0]);
    }
    if (total > MAX_TOTAL_SECONDS) {
        const only = scenes[0];
        if (only.type === "video") only.trimEnd = round1(only.trimStart + MAX_SCENE_SECONDS);
        else only.duration = MAX_SCENE_SECONDS;
        total = sceneLength(only);
    }

    return {
        ...storyboard,
        title: limitCaption(storyboard.title) || storyboard.title,
        scenes,
        total_duration: round1(scenes.reduce((sum, s) => sum + sceneLength(s), 0)),
    };
};

// Parses raw AI text into a validated, normalized storyboard. Throws with a readable message on failure.
export const parseStoryboard = (raw: string, media: IMediaInfo[], thumbnails: IThumbnail[] = []): Storyboard => {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let json: unknown;
    try {
        json = JSON.parse(cleaned);
    } catch {
        throw new Error("Reply is not valid JSON");
    }

    const result = StoryboardSchema.safeParse(json);
    if (!result.success) {
        throw new Error(
            result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        );
    }

    const storyboard = normalizeStoryboard(result.data, media, thumbnails);

    // Every thumbnail the user sent must appear once; a retry asks the AI to place the missing ones.
    const placed = new Set(
        storyboard.scenes.flatMap((s) => (s.type === "thumbnail" ? [s.thumbnail_id] : []))
    );
    const missing = thumbnails.filter((t) => !placed.has(t.thumbnail_id)).map((t) => t.thumbnail_id);
    if (missing.length > 0) {
        throw new Error(`Missing thumbnail scenes for: ${missing.join(", ")}`);
    }

    return storyboard;
};
