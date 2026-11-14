import { z } from "zod";

const description = z.string().trim().min(1);
const confidence = z.number().min(0).max(1);

export const visualAnalysisSchema = z.object({
    faceShape: z.object({
        type: description,
        description,
        confidence,
    }).strict(),
    faceProportions: z.object({
        forehead: description,
        cheekbones: description,
        jawline: description,
        chin: description,
    }).strict(),
    eyes: z.object({
        shape: description,
        size: description,
        spacing: description,
        eyelid: description,
        description,
        confidence,
    }).strict(),
    eyebrows: z.object({
        shape: description,
        thickness: description,
        curvature: description,
        description,
    }).strict(),
    nose: z.object({
        bridge: description,
        width: description,
        tip: description,
        description,
    }).strict(),
    lips: z.object({
        shape: description,
        upperLip: description,
        lowerLip: description,
        width: description,
    }).strict(),
    hair: z.object({
        style: description,
        texture: description,
        volume: description,
        hairline: description,
        color: description,
    }).strict(),
    facialHair: z.object({
        beard: description,
        moustache: description,
        sideburns: description,
    }).strict(),
    expression: z.object({
        type: description,
        description,
    }).strict(),
    distinctiveFeatures: z.array(description),
    uncertainties: z.array(description),
}).strict();

export type FaceAppearance = z.infer<typeof visualAnalysisSchema>;
