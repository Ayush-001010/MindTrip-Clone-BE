import { z } from "zod";
import { visualAnalysisSchema } from "./IVisualAnalysis";

export const faceLandmarksSchema = z.object({
    image: z.object({
        width: z.number().positive(),
        height: z.number().positive(),
    }),
    face: z.object({
        box: z.object({
            xMin: z.number(),
            yMin: z.number(),
            xMax: z.number(),
            yMax: z.number(),
            width: z.number(),
            height: z.number(),
        }),
        totalLandmarks: z.number().int().positive(),
        landmarks: z.array(z.object({
            index: z.number().int().nonnegative(),
            name: z.string().nullable(),
            x: z.number(),
            y: z.number(),
            z: z.number().optional(),
            normalizedX: z.number(),
            normalizedY: z.number(),
        })).min(1),
    }),
});

export type IFaceLandmarks = z.infer<typeof faceLandmarksSchema>;

export const faceAnalysisResultSchema = faceLandmarksSchema.extend({
    visualAnalysis: visualAnalysisSchema,
});

export type IFaceAnalysisResult = z.infer<typeof faceAnalysisResultSchema>;
