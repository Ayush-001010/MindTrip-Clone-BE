import { randomUUID } from "node:crypto";
import { HEAVY_MODEL } from "../../../../config/models";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import {
  IReelDirectorInput,
  ReelDirection,
  reelDirectionSchema,
} from "../../../../Interface/DataInterface/IReelDirection";
import ReelDirectorPrompt from "../../../../Prompt/ReelDirectorPrompt";

const MAX_RETRIES = 2;
const AI_TIMEOUT_MS = 2 * 60 * 1000;

export default class ReelDirectorAgent {
  // One text-only AI call: the model reads the analysis of every clip and picks the reel.
  direct = async (input: IReelDirectorInput): Promise<ReelDirection> => {
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
      let prompt = JSON.stringify(input);
      let lastError = "";

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[Reel director] Attempt ${attempt + 1}`);
        const response = await session.sendAndWait({ prompt }, AI_TIMEOUT_MS);
        const content = response?.data?.content ?? "";
        console.log("[Reel director] Raw reply:", content);

        try {
          const direction = this.parseResponse(content, input);
          console.log("[Reel director] Accepted:", {
            title: direction.title,
            scenes: direction.scenes.length,
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

  private parseResponse = (content: string, input: IReelDirectorInput): ReelDirection => {
    let parsed: unknown;
    try {
      // Models sometimes wrap JSON in a code fence
      parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
    } catch {
      throw new Error("Reply was not valid JSON");
    }

    const result = reelDirectionSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Reply did not match the schema: ${result.error.message}`);
    }

    const known = new Map(input.clips.map((clip) => [clip.id, clip]));
    const seen = new Set<string>();
    let totalSec = 0;
    for (const scene of result.data.scenes) {
      const clip = known.get(scene.clipId);
      if (!clip) throw new Error(`Unknown clipId "${scene.clipId}"`);
      if (seen.has(scene.clipId)) throw new Error(`clipId "${scene.clipId}" used more than once`);
      seen.add(scene.clipId);
      const sceneSec = scene.beats * input.music.beatSeconds;
      if (clip.segmentSeconds !== undefined && sceneSec > clip.segmentSeconds * 2) {
        throw new Error(`Scene for "${scene.clipId}" is ${sceneSec.toFixed(1)}s but its video segment is only ${clip.segmentSeconds}s`);
      }
      totalSec += sceneSec;
    }
    if (totalSec > input.targetSeconds.max + input.music.beatSeconds) {
      throw new Error(
        `Reel is ${totalSec.toFixed(1)}s long; it must be at most ${input.targetSeconds.max}s. Use fewer or shorter scenes`,
      );
    }
    // Only enforce the minimum when the media could reach it
    if (totalSec < input.targetSeconds.min * 0.8 && result.data.scenes.length < input.clips.length) {
      throw new Error(
        `Reel is only ${totalSec.toFixed(1)}s long; aim for ${input.targetSeconds.min} to ${input.targetSeconds.max}s using more or longer scenes`,
      );
    }

    return result.data;
  };
}
