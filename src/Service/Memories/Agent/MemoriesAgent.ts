import { IMemoriesAgent } from "../../../Interface/ClassInterface/IMemories";
import { readFile } from "node:fs/promises";
import CopilotManager from "../../../Manager/CopilotManager";
import { characterAnalysisResultSchema, MascotColorMode } from "../../../Interface/DataInterface/ICharacterSpecification";

export default class MemoriesAgent implements IMemoriesAgent {
    convertImageToCartoon = async (filePath: string, colorMode?: MascotColorMode) => {
        const imageBuffer = await readFile(filePath);
        const copilotManager = new CopilotManager();
        const response = await copilotManager.genrateCartoon("Genrate cartoon for the attached image", imageBuffer, colorMode);
        if (!response || !response.success || response.error) {
            return {
                success: false,
                error: response?.error || "Cartoon generation failed.",
            };
        }
        const result = characterAnalysisResultSchema.safeParse(response.data);
        if (!result.success) {
            console.error("Character analysis returned invalid data:", result.error);
            return {
                success: false,
                error: "Character analysis returned invalid data.",
            };
        }
        return {
            success: true,
            data: result.data,
        };
    }
}
