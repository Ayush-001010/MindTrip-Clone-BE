import type { IFaceLandmarks } from "../../../../Interface/DataInterface/IFaceLandmarks";
import type { FaceAppearance } from "../../../../Interface/DataInterface/IVisualAnalysis";
import {
  CharacterSpecification,
  MascotColorMode,
  characterSpecificationSchema,
} from "../../../../Interface/DataInterface/ICharacterSpecification";

export function buildCharacterSpecification(
  faceData: IFaceLandmarks,
  appearance: FaceAppearance,
  colorMode: MascotColorMode = "monochrome",
): CharacterSpecification {
  const { box, landmarks } = faceData.face;
  if (!Number.isFinite(box.width) || box.width <= 0 ||
      !Number.isFinite(box.height) || box.height <= 0) {
    throw new Error("Cannot build a character specification with an invalid face bounding box.");
  }

  const points = new Map(landmarks.map((point) => [point.index, point]));
  const uncertainties = [...appearance.uncertainties];
  const distance = (first: { x: number; y: number }, second: { x: number; y: number }) =>
    Math.hypot(first.x - second.x, first.y - second.y) / box.width;
  const pairDistance = (firstIndex: number, secondIndex: number, feature: string) => {
    const first = points.get(firstIndex);
    const second = points.get(secondIndex);
    if (!first || !second) {
      uncertainties.push(`${feature} could not be calculated because landmarks are missing.`);
      return undefined;
    }
    return distance(first, second);
  };

  const eyeCorners = [33, 133, 362, 263].map((index) => points.get(index));
  let eyeSpacing: number | undefined;
  const [outerA, innerA, innerB, outerB] = eyeCorners;
  if (outerA && innerA && innerB && outerB) {
    eyeSpacing = distance(
      { x: (outerA.x + innerA.x) / 2, y: (outerA.y + innerA.y) / 2 },
      { x: (outerB.x + innerB.x) / 2, y: (outerB.y + innerB.y) / 2 },
    );
  } else {
    uncertainties.push("Eye spacing could not be calculated because landmarks are missing.");
  }

  const noseWidth = pairDistance(98, 327, "Nose width");
  const mouthWidth = pairDistance(61, 291, "Mouth width");

  return characterSpecificationSchema.parse({
    version: "1.0",
    appearance,
    geometry: {
      imageWidth: faceData.image.width,
      imageHeight: faceData.image.height,
      faceBoundingBox: box,
      landmarks,
      proportions: {
        faceWidthToHeight: box.width / box.height,
        ...(eyeSpacing !== undefined && { eyeSpacing }),
        ...(noseWidth !== undefined && { noseWidth }),
        ...(mouthWidth !== undefined && { mouthWidth }),
      },
    },
    illustration: {
      style: colorMode === "monochrome"
        ? "Cartoon monochrome mascot with black outlines, transparent face, and dark hair with transparent streak cutouts"
        : "Cartoon mascot with black outlines, transparent face, natural hair colors, and transparent streak cutouts",
      framing: "Close-up of the face and hair only; no neck, body, clothing, or props",
      preserveFeatures: [
        "Recognizable face shape, hairstyle, and expression",
        "Glasses and facial hair when visible in the photo",
      ],
      simplificationRules: [
        "Use clean lines and simple shapes",
        "Keep the face as the main focal point",
        "Do not add text or accessories absent from the photo",
      ],
      background: "transparent",
    },
    uncertainties,
  });
}
