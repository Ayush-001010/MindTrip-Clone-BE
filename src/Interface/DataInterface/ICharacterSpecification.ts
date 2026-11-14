import { z } from "zod";
import { faceLandmarksSchema } from "./IFaceLandmarks";
import { visualAnalysisSchema } from "./IVisualAnalysis";

export const mascotColorModeSchema = z.enum(["monochrome", "color"]);
export type MascotColorMode = z.infer<typeof mascotColorModeSchema>;

export const characterSpecificationSchema = z.object({
    version: z.string().trim().min(1),
    appearance: visualAnalysisSchema,
    geometry: z.object({
        imageWidth: z.number().positive(),
        imageHeight: z.number().positive(),
        faceBoundingBox: faceLandmarksSchema.shape.face.shape.box.extend({
            width: z.number().positive(),
            height: z.number().positive(),
        }),
        landmarks: faceLandmarksSchema.shape.face.shape.landmarks,
        proportions: z.object({
            faceWidthToHeight: z.number().positive(),
            eyeSpacing: z.number().nonnegative().optional(),
            noseWidth: z.number().nonnegative().optional(),
            mouthWidth: z.number().nonnegative().optional(),
        }).strict(),
    }).strict(),
    illustration: z.object({
        style: z.string().trim().min(1),
        framing: z.string().trim().min(1),
        preserveFeatures: z.array(z.string().trim().min(1)),
        simplificationRules: z.array(z.string().trim().min(1)),
        background: z.string().trim().min(1),
    }).strict(),
    uncertainties: z.array(z.string().trim().min(1)),
}).strict();

export type CharacterSpecification = z.infer<typeof characterSpecificationSchema>;

export const characterAnalysisResultSchema = z.object({
    svg: z.string().trim().min(1),
});

export type ICharacterAnalysisResult = z.infer<typeof characterAnalysisResultSchema>;
