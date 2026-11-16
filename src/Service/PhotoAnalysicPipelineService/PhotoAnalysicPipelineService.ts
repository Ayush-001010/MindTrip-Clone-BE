import axios from "axios";
import crypto from "crypto";
import sharp from "sharp";
import ICloudService from "../../Interface/ClassInterface/ICloudService";
import IMemories, { IMemoryVisualMedia } from "../../Interface/ClassInterface/IMemories";
import IPhotoAnalysicPipeline, { IPhotoPipelineResult } from "../../Interface/ClassInterface/IPhotoAnalysicPipeline";
import AWS from "../Cloud/AWS/AWS";
import PhotoAnalysicAgent from "../Copilot/Agent/PhotoAnalysicAgent/PhotoAnalysicAgent";
import Memories from "../Memories/Memories";

const PHOTOS_PER_AI_CALL = 10;
const MAX_PHOTO_BYTES = 30 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60 * 1000;

interface IScreenedPhoto {
  mediaId: number;
  thumbnail: Buffer;
  technical: {
    width: number;
    height: number;
    sha256: string;
    brightness: number;
    tooDark: boolean;
    tooBright: boolean;
  };
}

export default class PhotoAnalysicPipelineService implements IPhotoAnalysicPipeline {
  private awsInstance: ICloudService;
  private memoriesInstance: IMemories;
  private agent: PhotoAnalysicAgent;

  constructor() {
    this.awsInstance = new AWS();
    this.memoriesInstance = new Memories();
    this.agent = new PhotoAnalysicAgent();
  }

  // Step 1: Download the original photo through the CDN.
  // Network errors are thrown so BullMQ retries the job.
  private fetchPhoto = async (key: string): Promise<Buffer> => {
    const response = this.awsInstance.getImages(key);
    if (!response.cloudServiceSuccess || !response.data) {
      throw new Error(`Could not build a URL for ${key}`);
    }
    const imageResponse = await axios.get(response.data, {
      responseType: "arraybuffer",
      timeout: DOWNLOAD_TIMEOUT_MS,
      maxContentLength: MAX_PHOTO_BYTES,
    });
    return Buffer.from(imageResponse.data);
  };

  // Step 2: Technical screening with Sharp. Returns null if the file isn't a readable image.
  private screenPhoto = async (mediaId: number, photo: Buffer): Promise<IScreenedPhoto | null> => {
    try {
      const metadata = await sharp(photo).metadata();
      if (!metadata.width || !metadata.height) return null;

      // Thumbnail for the AI: auto-rotated, max 512px, small JPEG.
      const thumbnail = await sharp(photo)
        .rotate()
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Brightness is measured on the thumbnail; it's much faster than the original.
      const stats = await sharp(thumbnail).greyscale().stats();
      const brightness = stats.channels[0].mean;

      // EXIF orientations 5–8 rotate by 90°, which swaps width and height.
      const rotated = (metadata.orientation ?? 1) >= 5;

      return {
        mediaId,
        thumbnail,
        technical: {
          width: rotated ? metadata.height : metadata.width,
          height: rotated ? metadata.width : metadata.height,
          sha256: crypto.createHash("sha256").update(photo).digest("hex"),
          brightness: Math.round(brightness),
          // Flags only: dark photos can still be great memories (e.g. night shots).
          tooDark: brightness < 40,
          tooBright: brightness > 215,
        },
      };
    } catch (error) {
      console.error(`Photo ${mediaId} could not be decoded:`, (error as Error).message);
      return null;
    }
  };

  private saveResult = async (mediaId: number, result: object) => {
    const saved = await this.memoriesInstance.saveMediaAnalysisResult(mediaId, result);
    if (!saved.success) {
      throw new Error(`Failed to save analysis for media ${mediaId}`);
    }
  };

  analysePhoto = async (items: IMemoryVisualMedia[], tag: string): Promise<IPhotoPipelineResult> => {
    console.log(`Starting analysis for tag: ${tag} with ${items.length} items`);
    
    const summary: IPhotoPipelineResult = { analysed: 0, duplicates: 0, unreadable: 0 };
    // sha256 -> mediaId of the first photo with that content, across the whole tag.
    const seenHashes = new Map<string, number>();

    for (let i = 0; i < items.length; i += PHOTOS_PER_AI_CALL) {
      const chunk = items.slice(i, i + PHOTOS_PER_AI_CALL);

      const screened = await Promise.all(
        chunk.map(async (item) => this.screenPhoto(item.id, await this.fetchPhoto(item.url))),
      );

      // Step 3: Save unreadable photos and exact duplicates without spending an AI call on them.
      const toAnalyse: IScreenedPhoto[] = [];
      for (const [index, photo] of screened.entries()) {
        if (!photo) {
          await this.saveResult(chunk[index].id, { status: "unreadable" });
          summary.unreadable++;
          continue;
        }

        const original = seenHashes.get(photo.technical.sha256);
        if (original !== undefined) {
          await this.saveResult(photo.mediaId, { status: "duplicate", duplicateOf: original, technical: photo.technical });
          summary.duplicates++;
          continue;
        }

        seenHashes.set(photo.technical.sha256, photo.mediaId);
        toAnalyse.push(photo);
      }

      if (toAnalyse.length === 0) continue;

      // Step 4: One AI call for the whole chunk, then save each photo's result.
      const aiResults = await this.agent.analysePhotos(tag, toAnalyse);
      for (const photo of toAnalyse) {
        const ai = aiResults.find((result) => result.mediaId === String(photo.mediaId))!;
        await this.saveResult(photo.mediaId, { status: "analysed", technical: photo.technical, ai });
        summary.analysed++;
      }
    }

    return summary;
  };
}
