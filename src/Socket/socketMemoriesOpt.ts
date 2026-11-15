import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uploadDir } from "../Middleware/upload";
import Memories from "../Service/Memories/Memories";
import RedisService from "../Service/RedisService/RedisService";
import { mascotColorModeSchema } from "../Interface/DataInterface/ICharacterSpecification";

export const MAX_SOCKET_IMAGE_BYTES = 5 * 1024 * 1024;

const socketMemoriesOpt = (io: any) => {
    const memoriesInstance = new Memories();
    const redisService = new RedisService();
    
    io.on("connection", (socket: any) => {
        socket.on("room:join", async (data : { workId: string , userId : string }) => {
            console.log(`Received room join request:`, data);
            const { workId : roomId, userId } = data;
            console.log(`Joining room: ${roomId}`);
            socket.join(roomId);
            const memoryDetails = await memoriesInstance.fetchParticularMemoryDetails(roomId);
            console.log(`Memory details for room ${roomId}:`, memoryDetails);
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
            console.log(`Users in room ${roomId}:`, roomUsers);
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
    })
}

export default socketMemoriesOpt;