import { randomUUID } from "node:crypto";
import { HEAVY_MODEL } from "../../../../config/models";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import {
  IPhotoForAnalysis,
  PhotoAnalysisItem,
  photoAnalysisResponseSchema,
} from "../../../../Interface/DataInterface/IPhotoAnalysis";
import PhotoAnalysisPrompt from "../../../../Prompt/PhotoAnalysisPrompt";

const MAX_RETRIES = 2;
const AI_TIMEOUT_MS = 3 * 60 * 1000;

export default class PhotoAnalysicAgent {
  // Analyses one batch of photos from the same place in a single AI call.
  analysePhotos = async (tag: string, photos: IPhotoForAnalysis[]): Promise<PhotoAnalysisItem[]> => {
    const session = await CopilotClientFactory.getInstance().createSession({
      sessionId: `photo-analysis-${randomUUID()}`,
      model: HEAVY_MODEL,
      availableTools: [],
      systemMessage: { content: PhotoAnalysisPrompt },
    });

    const attachments = photos.map((photo) => ({
      type: "blob" as const,
      data: photo.thumbnail.toString("base64"),
      mimeType: "image/jpeg",
      displayName: String(photo.mediaId),
    }));

    try {
      let prompt = `Place: "${tag}". Analyse the ${photos.length} attached photos.`;
      let lastError = "";

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        // Photos are attached only once; the session keeps them for retries.
        const response = await session.sendAndWait(
          attempt === 0 ? { prompt, attachments } : { prompt },
          AI_TIMEOUT_MS,
        );

        try {
          console.log(`Photo analysis attempt ${attempt + 1} response:`, response?.data?.content ?? "No content");
          return this.parseResponse(response?.data?.content ?? "", photos);
        } catch (error) {
          lastError = (error as Error).message;
          console.error(`Photo analysis attempt ${attempt + 1} invalid:`, lastError);
          prompt = `Your previous reply was invalid: ${lastError}. Reply again with ONE corrected JSON object only.`;
        }
      }
      

      throw new Error(`AI did not return a valid photo analysis: ${lastError}`);
    } finally {
      await session.disconnect();
    }
  };

  private parseResponse = (content: string, photos: IPhotoForAnalysis[]): PhotoAnalysisItem[] => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Reply was not valid JSON");
    }

    const result = photoAnalysisResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Reply did not match the schema: ${result.error.message}`);
    }

    // Every photo we sent must come back exactly once, and nothing else.
    const expected = new Set(photos.map((photo) => String(photo.mediaId)));
    const returned = result.data.photos.map((photo) => photo.mediaId);
    const missing = [...expected].filter((id) => !returned.includes(id));
    const unknown = returned.filter((id) => !expected.has(id));
    if (missing.length || unknown.length || returned.length !== expected.size) {
      throw new Error(`mediaIds mismatch. Missing: [${missing}], unknown or duplicated: [${unknown}]`);
    }

    return result.data.photos;
  };
}
