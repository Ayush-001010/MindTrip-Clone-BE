import { z } from "zod";

const text = z.string().trim().min(1);
const fraction = z.number().min(0).max(1);

export const photoAnalysisItemSchema = z.object({
    mediaId: text,
    description: text,
    scene: z.enum(["landscape", "people", "food", "activity", "architecture", "street", "transport", "nightlife", "nature", "other"]),
    subjects: z.array(text).max(5),
    people: z.enum(["none", "one", "couple", "group", "crowd"]),
    shotType: z.enum(["wide", "medium", "close-up", "selfie", "detail"]),
    mood: text,
    storyRoles: z.array(z.enum(["opening", "journey", "highlight", "detail", "ending"])).min(1),
    focalPoint: z.object({ x: fraction, y: fraction }).strict(),
    reelScore: z.number().int().min(0).max(10),
    issues: z.array(text),
    uncertainties: z.array(text),
}).strict();

export const photoAnalysisResponseSchema = z.object({
    photos: z.array(photoAnalysisItemSchema),
}).strict();

export type PhotoAnalysisItem = z.infer<typeof photoAnalysisItemSchema>;

export interface IPhotoForAnalysis {
    mediaId: number;
    thumbnail: Buffer;
}
