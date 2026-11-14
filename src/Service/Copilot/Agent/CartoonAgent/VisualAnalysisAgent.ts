import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { HEAVY_MODEL } from "../../../../config/models";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import type { IFaceLandmarks } from "../../../../Interface/DataInterface/IFaceLandmarks";
import { FaceAppearance, visualAnalysisSchema } from "../../../../Interface/DataInterface/IVisualAnalysis";
import VisualAnalysisPrompt from "../../../../Prompt/VisualAnalysisPrompt";

export default class VisualAnalysisAgent {
    async analyze(image: Buffer, faceData: IFaceLandmarks): Promise<FaceAppearance> {
        const photo = await sharp(image).png().toBuffer();
        const session = await CopilotClientFactory.getInstance().createSession({
            sessionId: `visual-analysis-${randomUUID()}`,
            model: HEAVY_MODEL,
            availableTools: [],
            systemMessage: { content: VisualAnalysisPrompt },
        });

        try {
            const response = await session.sendAndWait({
                prompt: [
                    "Describe the detected person's visible facial appearance in the attached photo.",
                    `The image is ${faceData.image.width} by ${faceData.image.height} pixels.`,
                    `The detected face box is x=${faceData.face.box.xMin} to ${faceData.face.box.xMax}, y=${faceData.face.box.yMin} to ${faceData.face.box.yMax}, measured from the top-left.`,
                    "Use that box to identify the person; do not describe other people.",
                ].join("\n"),
                attachments: [{
                    type: "blob",
                    data: photo.toString("base64"),
                    mimeType: "image/png",
                    displayName: "user-photo.png",
                }],
            }, 180000);
            const content = response?.data.content;
            if (!content?.trim()) {
                throw new Error("Visual analysis returned no content.");
            }

            let parsed: unknown;
            try {
                parsed = JSON.parse(content);
            } catch {
                throw new Error("Visual analysis returned invalid JSON.");
            }
            const result = visualAnalysisSchema.safeParse(parsed);
            if (!result.success) {
                console.error("Visual analysis returned an invalid specification:", result.error);
                throw new Error("Visual analysis returned an invalid specification.");
            }
            return result.data;
        } catch (error) {
            console.error("Visual analysis failed:", error);
            try {
                await session.abort();
            } catch (abortError) {
                console.error("Failed to abort visual analysis:", abortError);
            }
            throw error;
        } finally {
            await session.disconnect();
        }
    }
}
