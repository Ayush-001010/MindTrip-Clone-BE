import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import ITripHistory from "../../../../Interface/DataInterface/ITripHistory";
import * as tf from "@tensorflow/tfjs-node";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { visualizeLandmarks } from "./visualizeLandmarks";
import VisualAnalysisAgent from "./VisualAnalysisAgent";
import { buildCharacterSpecification } from "./buildCharacterSpecification";
import SvgMascotAgent from "./SvgMascotAgent";
import type { MascotColorMode } from "../../../../Interface/DataInterface/ICharacterSpecification";

interface FaceLandmark {
  index: number;
  name: string | null;

  x: number;
  y: number;
  z?: number;

  normalizedX: number;
  normalizedY: number;
}

export default class CartoonAgent implements IAgentStrategy {
  private static readonly SESSION_WAIT_TIMEOUT_MS = 180000;
  private detectorPromise: ReturnType<
    typeof faceLandmarksDetection.createDetector
  > | null = null;

  private getFaceDetector = async () => {
    if (!this.detectorPromise) {
      this.detectorPromise = (async () => {
        // The native TensorFlow backend lacks the Transform kernel used by this model.
        if (!(await tf.setBackend("cpu"))) {
          throw new Error("Failed to initialize the TensorFlow.js CPU backend.");
        }
        await tf.ready();
        return faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          { runtime: "tfjs", refineLandmarks: false, maxFaces: 2 },
        );
      })().catch((error) => {
        this.detectorPromise = null;
        throw error;
      });
    }
    return this.detectorPromise;
  };

  private detectFaces = async (
    detector: faceLandmarksDetection.FaceLandmarksDetector,
    image: tf.Tensor3D,
  ): Promise<faceLandmarksDetection.Face[]> => {
    const options = { staticImageMode: true };
    const faces = await detector.estimateFaces(image, options);
    if (faces.length > 0) {
      return faces;
    }

    const [height, width] = image.shape;
    const cropWidth = Math.ceil(width * 2 / 3);
    const cropHeight = Math.ceil(height * 2 / 3);
    const detected: faceLandmarksDetection.Face[] = [];

    for (const top of [0, height - cropHeight]) {
      for (const left of [0, width - cropWidth]) {
        const crop = image.slice([top, left, 0], [cropHeight, cropWidth, 3]);
        try {
          const cropFaces = await detector.estimateFaces(crop, options);
          for (const face of cropFaces) {
            const box = {
              ...face.box,
              xMin: face.box.xMin + left,
              xMax: face.box.xMax + left,
              yMin: face.box.yMin + top,
              yMax: face.box.yMax + top,
            };
            const duplicate = detected.some((existing) => {
              const intersectionWidth = Math.max(0, Math.min(box.xMax, existing.box.xMax) - Math.max(box.xMin, existing.box.xMin));
              const intersectionHeight = Math.max(0, Math.min(box.yMax, existing.box.yMax) - Math.max(box.yMin, existing.box.yMin));
              const intersection = intersectionWidth * intersectionHeight;
              const union = box.width * box.height + existing.box.width * existing.box.height - intersection;
              return union > 0 && intersection / union >= 0.5;
            });
            if (!duplicate) {
              detected.push({
                box,
                keypoints: face.keypoints.map((point) => ({
                  ...point,
                  x: point.x + left,
                  y: point.y + top,
                })),
              });
            }
          }
        } finally {
          crop.dispose();
        }
      }
    }
    return detected;
  };

  private extractFaceLandmarks = async (base64Image: Buffer) => {
    const detector = await this.getFaceDetector();

    const { data, info } = await sharp(base64Image)
      .toColourspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const imageTensor = tf.tensor3d(data, [info.height, info.width, 3], "int32");

    try {
      const [height, width] = imageTensor.shape;

      // Detect facial landmarks
      const faces = await this.detectFaces(detector, imageTensor);

      if (faces.length === 0) {
        throw new Error("No face detected. Try a clear photo with a larger, unobstructed face.");
      }

      if (faces.length > 1) {
        throw new Error(
          "Multiple faces detected. Please upload a photo with one face.",
        );
      }

      const face = faces[0];


      // Convert keypoints into our own data structure
      const landmarks: FaceLandmark[] = face.keypoints.map((point, index) => ({
        index,

        name: point.name ?? null,

        x: point.x,
        y: point.y,
        z: point.z,

        normalizedX: point.x / width,
        normalizedY: point.y / height,
      }));

      return {
        image: {
          width,
          height,
        },

        face: {
          box: face.box,

          totalLandmarks: landmarks.length,

          landmarks,
        },
      };
    } finally {
      // Release image tensor memory
      imageTensor.dispose();
    }
  };

  executeAgent = async (
    userPrompt: string,
    history?: Array<ITripHistory>,
    base64Image?: Buffer,
    colorMode: MascotColorMode = "monochrome",
  ) => {
    if (!base64Image) {
      throw new Error("No image provided");
    }

    const faceData = await this.extractFaceLandmarks(base64Image);
    const landmarkImage = await visualizeLandmarks(
      base64Image,
      faceData.image.width,
      faceData.image.height,
      faceData.face.landmarks,
    );

    const visualAnalysis = await new VisualAnalysisAgent().analyze(base64Image, faceData);
    const characterSpecification = buildCharacterSpecification(faceData, visualAnalysis, colorMode);
    const svg = await new SvgMascotAgent().generate(base64Image, landmarkImage, characterSpecification, colorMode);
    const outputDirectory = path.resolve("output");
    await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
    const svgPath = path.join(outputDirectory, `cartoon-${randomUUID()}.svg`);
    await writeFile(svgPath, svg, { encoding: "utf8", flag: "wx", mode: 0o600 });
    console.log("Mascot SVG saved to:", svgPath);
    return { svg };
  };
}
