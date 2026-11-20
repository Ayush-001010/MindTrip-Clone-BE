import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uploadDir } from "../Middleware/upload";
import Memories from "../Service/Memories/Memories";
import RedisService from "../Service/RedisService/RedisService";
import { mascotColorModeSchema } from "../Interface/DataInterface/ICharacterSpecification";
import BullMQService from "../Service/BullMQService/BullMQService";

export const MAX_SOCKET_IMAGE_BYTES = 5 * 1024 * 1024;

const socketMemoriesOpt = (io: any) => {
    const memoriesInstance = new Memories();
    const redisService = new RedisService();
    const bullMQInstance = new BullMQService();
    
    io.on("connection", (socket: any) => {
        socket.on("room:join", async (data : { workId: string , userId : string }) => {
            const { workId : roomId, userId } = data;
            socket.join(roomId);
            const memoryDetails = await memoriesInstance.fetchParticularMemoryDetails(roomId);
            if (memoryDetails.success) {
                socket.emit("room:memoryDetails", memoryDetails.data);
            } else {
                socket.emit("room:memoryDetails:error", "Failed to fetch memory details");
            }

            const writeResponse = await redisService.createOrUpdate(roomId, userId , "list");
            if (!writeResponse.redisOptSuccess) {
                socket.emit("room:users", writeResponse);
                return;
            }
            const roomUsers = await redisService.getList(roomId);
            if (roomUsers.redisOptSuccess) {
                socket.emit("room:users", roomUsers);
                return;
            }
        });

        socket.on("room:convertImageToCartoon", async (data: { image?: unknown; colorMode?: unknown } | null) => {
            const image = data?.image;
            if (!Buffer.isBuffer(image) || image.length === 0 || image.length > MAX_SOCKET_IMAGE_BYTES) {
                socket.emit("room:convertImageToCartoon:error", "Provide a non-empty image of at most 5 MB.");
                return;
            }

            const colorMode = mascotColorModeSchema.default("monochrome").safeParse(data?.colorMode);
            if (!colorMode.success) {
                socket.emit("room:convertImageToCartoon:error", 'colorMode must be "monochrome" or "color".');
                return;
            }

            let format: string | undefined;
            try {
                const decodedImage = sharp(image);
                format = (await decodedImage.metadata()).format;
                if (format !== "jpeg" && format !== "png" && format !== "webp") {
                    socket.emit("room:convertImageToCartoon:error", "Only JPEG, PNG, and WebP images are supported.");
                    return;
                }
                await decodedImage.stats();
            } catch (error) {
                console.error("Invalid socket image upload:", error);
                socket.emit("room:convertImageToCartoon:error", "The image could not be decoded.");
                return;
            }

            try {
                await mkdir(uploadDir, { recursive: true });
                const filename = `${randomUUID()}.${format}`;
                const filePath = path.join(uploadDir, filename);
                await writeFile(filePath, image, { flag: "wx" });
                const resultAgent = await memoriesInstance.convertImageToCartoon(filePath, colorMode.data);
                if (!resultAgent.success || !resultAgent.data) {
                    throw new Error(Array.isArray(resultAgent.error)
                        ? resultAgent.error.join(", ")
                        : resultAgent.error || "Cartoon generation returned no content.");
                }
                socket.emit("room:convertImageToCartoon:landmarks", resultAgent.data);
            } catch (error) {
                console.error("Socket cartoon conversion failed:", error);
                socket.emit("room:convertImageToCartoon:error", "Failed to convert the image to a cartoon.");
            }
        });

        socket.on("room:changePlaceInMemory", async (data: { placeName: string; id: number }) => {
            const placeName = data.placeName;
            const id = data.id;
            console.log("Changing place in memory:", placeName, id);

            const result = await memoriesInstance.changePlaceInMemory(placeName, id);
            if (!result.success || !result.data) {
                socket.emit("room:changePlaceInMemory:error", "Failed to change place in memory.");
                return;
            }
            socket.emit("room:changePlaceInMemory:success", true);
        });

        socket.on("room:addMediaToMemory", async (data: { memoryId: number; type: "pic" | "video" | "audio"; url: string; tag?: string }[]) => {
            const results = await Promise.all(data.map(item => memoriesInstance.addMediaToMemory(item.memoryId, item.type, item.url, item.tag)));
            const failed = results.find(result => !result.success || !result.data);
            if (failed) {
                socket.emit("room:addMediaToMemory:error", "Failed to add media to memory.");
                return;
            }
            socket.emit("room:addMediaToMemory:success", true);
        });

        socket.on("room:reelGenerationConversation" , async (data: { memoryId: number , userMessage: string , actionType: "Start" | "Other" , userName: string }) => {
            console.log("Reel generation conversation data:", data);
            const chatResult = await memoriesInstance.addChatToMemory(data.memoryId, data.userMessage, data.actionType, data.userName);
            if(data.actionType === "Start"){
            socket.emit("room:reelGenrationProcessIsStarted");
            }
            if(chatResult.success && data.actionType === "Start"){
                const bullMQResult = await bullMQInstance.addToReelQueue(data.memoryId);
                if(!bullMQResult){
                    socket.emit("room:reelGenerationConversation:error", "Failed to add to reel queue.");
                    return;
                }
                socket.emit("room:reelGenerationConversation:success", true);

                const intervalId = setInterval(async () => {
                    console.log("Fetching batch reel analysis for memoryId:", data.memoryId);
                    const batchResult = await memoriesInstance.fetchBatchReelAnalysis(data.memoryId);
                    if(!batchResult.success){
                        clearInterval(intervalId);
                        return;
                    }
                    if(batchResult.data && batchResult.data.length>0){
                        const allCompleted = batchResult.data.every(batch => batch.status === "completed");
                        // Return unique tagName values with status of latest batch
                        const uniqueTagNames = Array.from(new Set(batchResult.data.map(batch => batch.tagName)));
                        const latestBatchStatus = uniqueTagNames.map(tagName => {
                            const latestBatch = (batchResult?.data || []).filter(batch => batch.tagName === tagName).pop();
                            return { tagName, status: latestBatch?.status };
                        });
                        socket.emit("room:analysisBatchStatus", latestBatchStatus);
                        if(allCompleted){
                            socket.emit("room:reelGenerationConversation:completed", true);
                            clearInterval(intervalId);
                        }
                    }
                },1000*10);
                socket.on("disconnect", () => clearInterval(intervalId));
            }
        });

        socket.on("room:createMemoriesRoom", async (data: { memoryId: number, name: string }) => {
            const result = await memoriesInstance.createMemoriesRoom(data.memoryId, data.name);
            if(result.success){
                socket.emit("room:createMemoriesRoom:success", { name: data.name });
            } else {
                socket.emit("room:createMemoriesRoom:error", "Failed to create memories room.");
            }
        });

        socket.on("room:fetchRoomChats", async (data: { roomId: number }) => {
            const result = await memoriesInstance.fetchRoomChats(data.roomId);
            if(result.success){
                socket.emit("room:fetchRoomChats:success", result.data);
            } else {
                socket.emit("room:fetchRoomChats:error", "Failed to fetch room chats.");
            }
        });

        socket.on("room:fetchAudioInMemory", async (data: { memoryId: number }) => {
            const result = await memoriesInstance.fetchAudioInMemory(data.memoryId);
            if(result.success){
                socket.emit("room:fetchAudioInMemory:success", result.data);
            } else {
                socket.emit("room:fetchAudioInMemory:error", "Failed to fetch audio in memory.");
            }
        });
    })
}

export default socketMemoriesOpt;