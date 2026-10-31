import { z } from "zod";
import CopilotClientFactory from "../../Factory/CopilotClientFactory";
import { LIGHT_MODEL } from "../../config/models";
import InstaStoryPrompt from "../../Prompt/InstaStoryPrompt";
import { IPhotoInput, IVideoInput } from "./StoryboardService";
import { BlogContext } from "./BlogContext";
import { toThumbnails } from "./Storyboard";

const MAX_RETRIES = 2;
const AI_TIMEOUT_MS = 2 * 60 * 1000;
const MAX_CAPTION_WORDS = 15;
const FRAMES_PER_VIDEO = 3;

const SuggestionSchema = z.object({
    media_id: z.string(),
    caption: z.string(),
    hashtags: z.array(z.string()).min(1),
    location_tag: z.string().default(""),
    sticker: z.object({
        type: z.enum(["poll", "question", "quiz", "emoji_slider", "countdown", "none"]).catch("none"),
        text: z.string().default(""),
    }),
    music_mood: z
        .enum(["upbeat", "calm", "cinematic", "romantic", "adventurous", "nostalgic"])
        .catch("upbeat"),
});

const InstaStorySchema = z.object({
    overall_theme: z.string().default(""),
    story_order: z.array(z.string()).default([]),
    suggestions: z.array(SuggestionSchema).min(1),
});

export type InstaStorySuggestions = z.infer<typeof InstaStorySchema>;

export interface IInstaStoryInput {
    userName?: string;
    thumbnails?: unknown;
    blog?: BlogContext;
    photos: IPhotoInput[];
    videos?: IVideoInput[];
}

const toHashtag = (tag: string) => {
    const clean = tag.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
    return clean ? `#${clean}` : "";
};

const parseSuggestions = (raw: string, mediaIds: string[], thumbnailIds: string[]): InstaStorySuggestions => {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let json: unknown;
    try {
        json = JSON.parse(cleaned);
    } catch {
        throw new Error("Reply is not valid JSON");
    }

    const result = InstaStorySchema.safeParse(json);
    if (!result.success) {
        throw new Error(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }

    const validIds = new Set(mediaIds);
    const validOrderIds = new Set([...mediaIds, ...thumbnailIds]);
    const byId = new Map(
        result.data.suggestions
            .filter((s) => validIds.has(s.media_id))
            .map((s) => [s.media_id, s])
    );

    const missing = mediaIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
        throw new Error(`Missing suggestions for: ${missing.join(", ")}`);
    }

    const suggestions = mediaIds.map((id) => {
        const s = byId.get(id)!;
        return {
            ...s,
            caption: s.caption.trim().split(/\s+/).slice(0, MAX_CAPTION_WORDS).join(" "),
            hashtags: [...new Set(s.hashtags.map(toHashtag).filter(Boolean))].slice(0, 8),
        };
    });

    const ordered = result.data.story_order.filter((id) => validOrderIds.has(id));
    const story_order = [...new Set([...ordered, ...mediaIds, ...thumbnailIds])];

    return { overall_theme: result.data.overall_theme, story_order, suggestions };
};

export default class InstaStoryService {
    async suggest(input: IInstaStoryInput): Promise<InstaStorySuggestions> {
        const videos = input.videos ?? [];
        const thumbnails = toThumbnails(input.thumbnails);
        const mediaIds = [...input.photos.map((p) => p.media_id), ...videos.map((v) => v.media_id)];

        // A few evenly spaced frames per video are enough to describe it.
        const videoFrames = videos.map((v) => {
            const frames = v.prepared.frames;
            if (frames.length <= FRAMES_PER_VIDEO) return frames;
            const step = frames.length / FRAMES_PER_VIDEO;
            return Array.from({ length: FRAMES_PER_VIDEO }, (_, i) => frames[Math.floor(i * step)]);
        });

        const attachments = [
            ...input.photos.map((p) => ({
                type: "file" as const,
                path: p.resizedPath,
                displayName: p.media_id,
            })),
            ...videoFrames.flatMap((frames) =>
                frames.map((f) => ({ type: "file" as const, path: f.path, displayName: f.label }))
            ),
        ];

        const userMessage = JSON.stringify({
            userName: input.userName,
            thumbnails,
            blog: input.blog,
            photos: input.photos.map((p) => ({
                media_id: p.media_id,
                where: p.note?.where,
                description: p.note?.description,
                duration: p.note?.duration,
            })),
            videos: videos.map((v, i) => ({
                media_id: v.media_id,
                where: v.note?.where,
                description: v.note?.description,
                frames: videoFrames[i].map((f) => ({ label: f.label, timestamp: f.timestamp })),
                transcript: v.prepared.transcript.map((t) => t.text),
            })),
        });

        const session = await CopilotClientFactory.getInstance().createSession({
            sessionId: `insta-story-${Date.now()}`,
            model: LIGHT_MODEL,
            systemMessage: { content: InstaStoryPrompt },
            availableTools: [],
        });

        try {
            let prompt = userMessage;
            let lastError = "";

            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                const response = await session.sendAndWait(
                    attempt === 0 ? { prompt, attachments } : { prompt },
                    AI_TIMEOUT_MS
                );

                try {
                    return parseSuggestions(response?.data?.content || "", mediaIds, thumbnails.map((t) => t.thumbnail_id));
                } catch (error) {
                    lastError = (error as Error).message;
                    console.error(`Insta story attempt ${attempt + 1} invalid:`, lastError);
                    prompt = `Your previous reply was invalid: ${lastError}. Reply again with ONE corrected JSON object only, following the same rules and schema.`;
                }
            }

            throw new Error(`AI did not return valid suggestions: ${lastError}`);
        } finally {
            await session.disconnect();
        }
    }
}
