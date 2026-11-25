import { randomUUID } from "node:crypto";
import { HEAVY_MODEL } from "../../../../config/models";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import {
  IReelDirectorInput,
  ReelDirectorResponse,
  reelDirectorResponseSchema,
} from "../../../../Interface/DataInterface/IReelDirection";
import ReelDirectorPrompt from "../../../../Prompt/ReelDirectorPrompt";
import type { ReelPreviewSheet } from "../../../ReelPlan/ReelVisualPreviews";

const MAX_RETRIES = 2;
const AI_TIMEOUT_MS = 2 * 60 * 1000;

export default class ReelDirectorAgent {
  direct = async (input: IReelDirectorInput, previews?: AsyncIterable<ReelPreviewSheet>): Promise<ReelDirectorResponse> => {
    console.log("[Reel director] Starting session:", {
      clips: input.clips.length,
      targetSeconds: input.targetSeconds,
    });
    const session = await CopilotClientFactory.getInstance().createSession({
      sessionId: `reel-director-${randomUUID()}`,
      model: HEAVY_MODEL,
      availableTools: [],
      systemMessage: { content: ReelDirectorPrompt },
    });

    try {
      const analysisById = new Map(input.clips.map(clip => [clip.id, clip]));
      let batch = 0;
      if (previews) {
        for await (const { image, clipIds } of previews) {
          console.log("[Reel director] Reviewing contact sheet:", { batch: ++batch, clips: clipIds.length });
          const review = await session.sendAndWait({
            prompt: `Preview batch ${batch}. Review the attached labeled tiles alongside their saved analysis. ` +
              `Write a short visual note per clip ID for the final edit; do not make the edit yet.\n` +
              JSON.stringify(clipIds.map(id => analysisById.get(id))),
            attachments: [{
              type: "blob",
              data: image.toString("base64"),
              mimeType: "image/jpeg",
              displayName: `reel-preview-${batch}.jpg`,
            }],
          }, AI_TIMEOUT_MS);
          if (!review?.data?.content?.trim()) throw new Error(`No visual review for contact sheet ${batch}`);
        }
      }
      let prompt = JSON.stringify(input);
      let lastError = "";

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[Reel director] Attempt ${attempt + 1}`);
        const response = await session.sendAndWait({ prompt }, AI_TIMEOUT_MS);
        const content = response?.data?.content ?? "";

        try {
          const direction = this.parseResponse(content, input);
          console.log("[Reel director] Accepted:", {
            title: direction.title,
            scenes: direction.scenes.length,
            musicWindowId: direction.musicWindowId,
          });
          return direction;
        } catch (error) {
          lastError = (error as Error).message;
          console.error(`[Reel director] Attempt ${attempt + 1} invalid:`, lastError);
          prompt = `Your previous reply was invalid: ${lastError}. Reply again with ONE corrected JSON object only.`;
        }
      }

      throw new Error(`AI did not return a valid reel direction: ${lastError}`);
    } finally {
      await session.disconnect();
    }
  };

  private parseResponse = (content: string, input: IReelDirectorInput): ReelDirectorResponse => {
    let parsed: unknown;
    try {
      // Models sometimes wrap JSON in a code fence
      parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
    } catch {
      throw new Error("Reply was not valid JSON");
    }

    const result = reelDirectorResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Reply did not match the schema: ${result.error.message}`);
    }

    const window = input.music.windows.find(candidate => candidate.id === result.data.musicWindowId);
    if (!window) throw new Error("Choose a musicWindowId from the supplied windows");
    const known = new Map(input.clips.map((clip) => [clip.id, clip]));
    const seen = new Set<string>();
    let cursor = 0;
    for (const scene of result.data.scenes) {
      const clip = known.get(scene.clipId);
      if (!clip) throw new Error(`Unknown clipId "${scene.clipId}"`);
      if (seen.has(scene.clipId)) throw new Error(`clipId "${scene.clipId}" used more than once`);
      seen.add(scene.clipId);
      const end = cursor + scene.beats;
      if (end >= window.beatTimes.length) {
        throw new Error(`The scenes exceed the ${window.usableSeconds}s available in the selected window`);
      }
      const sceneSec = window.beatTimes[end] - window.beatTimes[cursor];
      if (clip.segmentSeconds !== undefined && sceneSec > clip.segmentSeconds * 2 + 0.001) {
        throw new Error(`Scene for "${scene.clipId}" is ${sceneSec.toFixed(1)}s but its video segment is only ${clip.segmentSeconds}s`);
      }
      cursor = end;
    }
    const totalSec = window.beatTimes[cursor];
    // Only enforce the minimum when the media could reach it
    if (totalSec < Math.min(input.targetSeconds.min, window.usableSeconds) * 0.8 &&
      result.data.scenes.length < input.clips.length) {
      throw new Error(
        `Reel is only ${totalSec.toFixed(1)}s long; aim for ${input.targetSeconds.min} to ${input.targetSeconds.max}s using more or longer scenes`,
      );
    }

    return result.data;
  };
}
