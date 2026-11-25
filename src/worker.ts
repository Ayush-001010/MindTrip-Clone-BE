import "dotenv/config";
import { FlowProducer, Worker } from "bullmq";
import Memories from "./Service/Memories/Memories";
import { IReelBatchJobData,IReelJobData,IReelStoryboardJobData,REEL_BATCH_QUEUE,REEL_QUEUE, REEL_STORYBOARD_QUEUE, reelQueueConnection} from "./Queue/reelQueueConfig";
import PhotoAnalysicPipelineService from "./Service/PhotoAnalysicPipelineService/PhotoAnalysicPipelineService";
import VideoAnalysisPipelineService from "./Service/VideoAnalysisPipelineService/VideoAnalysisPipelineService";

const flowProducer = new FlowProducer({ connection: reelQueueConnection });
const memoryInstance = new Memories();

// 1. Receives { memoryId } when the user clicks "Create Reel".
// TODO: fetch the memory's media, group by tag, then use flowProducer.add(...)
//       to create the storyboard parent job with one child job per tag.
const reelWorker = new Worker<IReelJobData>( REEL_QUEUE, async (job) => {
    console.log("reelWorker:", job.data);
    const memoryId = job.data.memoryId;
    const response = await memoryInstance.fetchPlaceInMemory(job.data.memoryId);
    if(!response.success || !response.data) {
        throw new Error("Failed to fetch places in memory");
    }
    const places = response.data;
    await Promise.all(places.map(async (place) => {
      const res = await memoryInstance.createReelAnalysicBatch(memoryId, place);
      if(!res.success) {
        throw new Error(`Failed to create reel analysis batch for place: ${place}`);
      }
    }));

    await flowProducer.add({
      name: "create-batch",
      queueName: REEL_STORYBOARD_QUEUE,
      data: { memoryId },
      children: places.map((place) => ({
        name: "create-batch",
        queueName: REEL_BATCH_QUEUE,
        data: { memoryId, place },
        opts: { failParentOnFailure: true },
      })),
    })
  },
  { connection: reelQueueConnection },
);

// 2. Child job: analyses the photos of one place.
const photoAnalysicPipeline = new PhotoAnalysicPipelineService();
const videoAnalysisPipeline = new VideoAnalysisPipelineService();

const batchWorker = new Worker<IReelBatchJobData>( REEL_BATCH_QUEUE,async (job : any) => {
    const {memoryId , place} = job.data;
    const tag = place.split(",")[0];
    const response = await memoryInstance.fetchVisualMediaInMemory(memoryId , tag);
    if(!response.success || !response.data) {
        throw new Error(`Failed to fetch media for "${tag}"`);
    }

    // Skip photos analysed in an earlier run, so retries and repeat clicks are cheap.
    const photos = response.data.filter(item => item.type === "pic" && !item.isProcessed);
    const videos = response.data.filter(item => item.type === "video" && !item.isProcessed);

    try {
      const summary = await photoAnalysicPipeline.analysePhoto(photos, tag);
      console.log(`Photo analysis summary for tag "${tag}":`, summary);
      const videoSummary = await videoAnalysisPipeline.analyseVideo(videos, tag);
      console.log(`Video analysis summary for tag "${tag}":`, videoSummary);
      await memoryInstance.updateReelAnalysicBatchStatus(memoryId, place, "completed");
      console.log(`Memory ${memoryId}, "${tag}":`, summary);
      return summary;
    } catch (error) {
      await memoryInstance.updateReelAnalysicBatchStatus(memoryId, place, "failed");
      // Re-throw so BullMQ marks the job failed and can retry it.
      throw error;
    }
  },
  { connection: reelQueueConnection, concurrency: 2 },
);

const storyboardWorker = new Worker<IReelStoryboardJobData>(
  REEL_STORYBOARD_QUEUE,
  async (job) => {
    console.log("storyboardWorker:", job.data);
  },
  { connection: reelQueueConnection },
);

for (const worker of [reelWorker, batchWorker, storyboardWorker]) {
  worker.on("failed", (job, error) => {
    console.error(`[${worker.name}] Job ${job?.id} failed:`, error.message);
  });
  worker.on("error", (error) => {
    console.error(`[${worker.name}] Worker error:`, error.message);
  });
}

console.log("Reel workers are running...");
