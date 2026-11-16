import { randomUUID } from "node:crypto";
import sharp from "sharp";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import { HEAVY_MODEL } from "../../../../config/models";
import { IVideoFrame, parseVideoMoments, VideoMoment } from "../../../../Interface/DataInterface/IVideoAnalysis";
import VideoAnalysisPrompt from "../../../../Prompt/VideoAnalysisPrompt";

export default class VideoAnalysisAgent {
    private frameBudgetPromise?: Promise<number>;
    private useContactSheet = false;
    private maxImageBytes?: number;

    async frameBudget(): Promise<number> {
        if (!this.frameBudgetPromise) {
            this.frameBudgetPromise = this.loadFrameBudget().catch(error => {
                this.frameBudgetPromise = undefined;
                throw error;
            });
        }
        return this.frameBudgetPromise;
    }

    private async loadFrameBudget(): Promise<number> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error(
                "Copilot startup/model lookup timed out after 30 seconds; check runtime and authentication",
            )), 30000);
        });
        try {
            return await Promise.race([
                (async () => {
                    const client = CopilotClientFactory.getInstance();
                    console.log("[Video AI] Starting Copilot client");
                    await client.start();
                    console.log("[Video AI] Client started; fetching available models");
                    const models = await client.listModels();
                    console.log("[Video AI] Model lookup finished:", { modelCount: models.length, model: HEAVY_MODEL });
                    const model = models.find(item => item.id === HEAVY_MODEL);
                    if (!model?.capabilities.supports.vision) {
                        throw new Error(`Video analysis requires a vision-capable model: ${HEAVY_MODEL}`);
                    }
                    const imageLimit = model.capabilities.limits.vision?.max_prompt_images ?? 12;
                    if (!Number.isInteger(imageLimit) || imageLimit < 1) {
                        throw new Error(`Model ${HEAVY_MODEL} reports an invalid image limit: ${imageLimit}`);
                    }
                    this.useContactSheet = imageLimit === 1;
                    this.maxImageBytes = model.capabilities.limits.vision?.max_prompt_image_size;
                    const budget = this.useContactSheet ? 8 : Math.min(12, imageLimit);
                    console.log("[Video AI] Frame input configuration:", {
                        imageLimit, frameBudget: budget,
                        mode: this.useContactSheet ? "one contact sheet" : "individual images",
                    });
                    return budget;
                })(),
                timeout,
            ]);
        } finally {
            if (timer !== undefined) clearTimeout(timer);
        }
    }

    private async createContactSheet(frames: IVideoFrame[]): Promise<Buffer> {
        const width = 320;
        const height = 240;
        const columns = Math.min(3, frames.length);
        const tiles = await Promise.all(frames.map(async (frame, index) => {
            const label = Buffer.from(
                `<svg width="${width}" height="24"><rect width="100%" height="100%" fill="#111"/>` +
                `<text x="8" y="17" font-size="15" fill="white">` +
                `Frame ${index + 1} | ${frame.timestamp.toFixed(3)}s</text></svg>`,
            );
            const input = await sharp(frame.path)
                .resize(width, height - 24, { fit: "contain", background: "#111" })
                .extend({ bottom: 24, background: "#111" })
                .composite([{ input: label, left: 0, top: height - 24 }])
                .png()
                .toBuffer();
            return { input, left: (index % columns) * width, top: Math.floor(index / columns) * height };
        }));
        const sheet = await sharp({
            create: {
                width: columns * width, height: Math.ceil(frames.length / columns) * height,
                channels: 3, background: "#111",
            },
        }).composite(tiles).jpeg({ quality: 85 }).toBuffer();
        if (this.maxImageBytes && sheet.length > this.maxImageBytes) {
            throw new Error(`Video contact sheet exceeds the model's ${this.maxImageBytes}-byte image limit`);
        }
        return sheet;
    }

    async analyse(input: {
        videoId: number;
        tag: string;
        pass: "coarse" | "confirmation";
        duration: number;
        start: number;
        end: number;
        frames: IVideoFrame[];
        transcript: { start: number; end: number; text: string }[];
    }): Promise<VideoMoment[]> {
        const budget = await this.frameBudget();
        if (input.frames.length === 0 || input.frames.length > budget) {
            throw new Error(`Video analysis requires between 1 and ${budget} sampled frames`);
        }
        const attachments = this.useContactSheet ? [{
            type: "blob" as const,
            data: (await this.createContactSheet(input.frames)).toString("base64"),
            mimeType: "image/jpeg",
            displayName: `${input.videoId}-${input.pass}-contact-sheet.jpg`,
        }] : input.frames.map(frame => ({
            type: "file" as const,
            path: frame.path,
            displayName: `${input.videoId}@${frame.timestamp}s.jpg`,
        }));
        const session = await CopilotClientFactory.getInstance().createSession({
            sessionId: `video-analysis-${randomUUID()}`,
            model: HEAVY_MODEL,
            availableTools: [],
            systemMessage: { content: VideoAnalysisPrompt },
        });
        try {
            const { frames, ...context } = input;
            let prompt = JSON.stringify({
                ...context,
                frameLayout: this.useContactSheet ? "contact sheet; read left-to-right, top-to-bottom" : "individual images",
                frames: frames.map((frame, index) => ({ frameNumber: index + 1, timestamp: frame.timestamp })),
            });
            for (let attempt = 0; attempt < 3; attempt++) {
                const response = await session.sendAndWait({
                    prompt,
                    ...(attempt === 0 ? { attachments } : {}),
                }, 180000);
                try {
                    return parseVideoMoments(response?.data?.content ?? "", input.start, input.end);
                } catch (error) {
                    console.error(`Video ${input.videoId}: invalid AI response`, error);
                    if (attempt === 2) throw error;
                    prompt = `Correct the previous JSON response: ${error instanceof Error ? error.message : String(error)}`;
                }
            }
            throw new Error("Video analysis returned no result");
        } finally {
            await session.disconnect();
        }
    }
}
