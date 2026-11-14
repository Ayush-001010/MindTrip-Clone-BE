import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { HEAVY_MODEL } from "../../../../config/models";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import type { CharacterSpecification, MascotColorMode } from "../../../../Interface/DataInterface/ICharacterSpecification";
import CartoonAgentPrompt from "../../../../Prompt/CartoonAgentPrompt";

const responseSchema = z.union([
    z.object({ svg: z.string().trim().min(1), error: z.null() }).strict(),
    z.object({ svg: z.null(), error: z.string().trim().min(1) }).strict(),
]);

export default class SvgMascotAgent {
    async generate(image: Buffer, landmarkImage: Buffer, specification: CharacterSpecification, colorMode: MascotColorMode = "monochrome"): Promise<string> {
        const photo = await sharp(image).png().toBuffer();
        const styleReference = await readFile(path.resolve(__dirname, "../../../../../assets/mascot-style-reference.png"));
        const session = await CopilotClientFactory.getInstance().createSession({
            sessionId: `svg-mascot-${randomUUID()}`,
            model: HEAVY_MODEL,
            availableTools: [],
            systemMessage: { content: CartoonAgentPrompt },
        });

        try {
            const response = await session.sendAndWait({
                prompt: `Generate the mascot using the photo for identity, the landmark map for geometry, and the style reference only for visual style.\nColor mode: ${colorMode}.\nCharacter specification JSON:\n${JSON.stringify(specification)}`,
                attachments: [
                    { type: "blob", data: photo.toString("base64"), mimeType: "image/png", displayName: "user-photo.png" },
                    { type: "blob", data: landmarkImage.toString("base64"), mimeType: "image/png", displayName: "landmark-map.png" },
                    { type: "blob", data: styleReference.toString("base64"), mimeType: "image/png", displayName: "style-reference.png" },
                ],
            }, 180000);
            const content = response?.data.content;
            if (!content?.trim()) {
                throw new Error("SVG mascot generation returned no content.");
            }

            let parsed: unknown;
            try {
                parsed = JSON.parse(content);
            } catch {
                throw new Error("SVG mascot generation returned invalid JSON.");
            }
            const result = responseSchema.safeParse(parsed);
            if (!result.success) {
                console.error("SVG mascot generation returned an invalid response:", result.error);
                throw new Error("SVG mascot generation returned an invalid response.");
            }
            if (result.data.svg === null) {
                throw new Error(`SVG mascot generation failed: ${result.data.error}`);
            }
            const svg = result.data.svg;
            if (!/^<svg(?:\s|>)/i.test(svg)) {
                throw new Error("SVG mascot generation did not return an SVG root element.");
            }
            const renderer = sharp(Buffer.from(svg), { limitInputPixels: 16777216 });
            if ((await renderer.metadata()).format !== "svg") {
                throw new Error("SVG mascot generation did not return SVG data.");
            }
            await renderer.png().toBuffer();
            return svg;
        } catch (error) {
            console.error("SVG mascot generation failed:", error);
            try {
                await session.abort();
            } catch (abortError) {
                console.error("Failed to abort SVG mascot generation:", abortError);
            }
            throw error;
        } finally {
            await session.disconnect();
        }
    }
}
