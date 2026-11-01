import CopilotClientFactory from "../../Factory/CopilotClientFactory";
import { LIGHT_MODEL } from "../../config/models";
import StoryboardPrompt from "../../Prompt/StoryboardPrompt";
import { BlogContext } from "./BlogContext";
import { IPreparedVideo } from "../../Interface/ClassInterface/IBlogVideoGenration";
import {
    IMediaInfo,
    MAX_TOTAL_SECONDS,
    MIN_TOTAL_SECONDS,
    parseStoryboard,
    Storyboard,
    toThumbnails,
} from "./Storyboard";

export interface IPhotoInput {
    media_id: string;
    resizedPath: string;
    note?: { where?: string; description?: string; duration?: string };
}

export interface IVideoInput {
    media_id: string;
    prepared: IPreparedVideo;
    note?: { where?: string; description?: string; duration?: string };
}

export interface IStoryboardInput {
    userName?: string;
    thumbnails?: unknown;
    blog?: BlogContext;
    photos: IPhotoInput[];
    videos: IVideoInput[];
}

const MAX_RETRIES = 2;
const AI_TIMEOUT_MS = 3 * 60 * 1000;
const DEFAULT_MAX_IMAGES = 20;

type Attachment = { type: "file"; path: string; displayName: string };

export default class StoryboardService {
    private async getMaxImages(): Promise<number> {
        try {
            const models = await CopilotClientFactory.getInstance().listModels();
            const model = models.find((m) => m.id === LIGHT_MODEL);
            if (model && model.capabilities.supports.vision === false) {
                throw new Error(`Model ${LIGHT_MODEL} does not support images`);
            }
            return model?.capabilities.limits.vision?.max_prompt_images ?? DEFAULT_MAX_IMAGES;
        } catch (error) {
            if ((error as Error).message.includes("does not support images")) throw error;
            return DEFAULT_MAX_IMAGES;
        }
    }

    // Keeps all photos and shares the remaining image budget across videos, evenly spaced.
    private pickFrames(input: IStoryboardInput, maxImages: number) {
        const budget = Math.max(maxImages - input.photos.length, input.videos.length);
        const perVideo = Math.max(1, Math.floor(budget / Math.max(input.videos.length, 1)));

        return input.videos.map((v) => {
            const frames = v.prepared.frames;
            if (frames.length <= perVideo) return frames;
            const step = frames.length / perVideo;
            return Array.from({ length: perVideo }, (_, i) => frames[Math.floor(i * step)]);
        });
    }

    async generateStoryboard(input: IStoryboardInput): Promise<Storyboard> {
        const maxImages = await this.getMaxImages();
        const framesPerVideo = this.pickFrames(input, maxImages);

        const attachments: Attachment[] = [
            ...input.photos.map((p) => ({
                type: "file" as const,
                path: p.resizedPath,
                displayName: p.media_id,
            })),
            ...framesPerVideo.flatMap((frames) =>
                frames.map((f) => ({ type: "file" as const, path: f.path, displayName: f.label }))
            ),
        ];

        const thumbnails = toThumbnails(input.thumbnails);

        const media: IMediaInfo[] = [
            ...input.photos.map((p) => ({ media_id: p.media_id, type: "image" as const })),
            ...input.videos.map((v) => ({
                media_id: v.media_id,
                type: "video" as const,
                duration: v.prepared.duration,
            })),
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
            videos: input.videos.map((v, i) => ({
                media_id: v.media_id,
                duration_seconds: Number(v.prepared.duration.toFixed(1)),
                where: v.note?.where,
                description: v.note?.description,
                frames: framesPerVideo[i].map((f) => ({ label: f.label, timestamp: f.timestamp })),
                transcript: v.prepared.transcript.map((s) => ({ start: s.start, end: s.end, text: s.text })),
            })),
            target_seconds: { min: MIN_TOTAL_SECONDS, max: MAX_TOTAL_SECONDS },
        });

        const client = CopilotClientFactory.getInstance();
        const session = await client.createSession({
            sessionId: `blog-video-storyboard-${Date.now()}`,
            model: LIGHT_MODEL,
            systemMessage: { content: StoryboardPrompt },
            availableTools: [],
        });

        try {
            let prompt = userMessage;
            let lastError = "";

            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                const response = await session.sendAndWait(
                    // Images are only attached on the first turn; the session keeps them for retries.
                    attempt === 0 ? { prompt, attachments } : { prompt },
                    AI_TIMEOUT_MS
                );

                try {
                    return parseStoryboard(response?.data?.content || "", media, thumbnails);
                } catch (error) {
                    lastError = (error as Error).message;
                    console.error(`Storyboard attempt ${attempt + 1} invalid:`, lastError);
                    prompt = `Your previous reply was invalid: ${lastError}. Reply again with ONE corrected JSON object only, following the same rules and schema.`;
                }
            }

            throw new Error(`AI did not return a valid storyboard: ${lastError}`);
        } finally {
            await session.disconnect();
        }
    }
}
