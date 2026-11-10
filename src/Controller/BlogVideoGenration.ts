import { Request, Response } from "express";
import fs from "fs";
import { uploadDir } from "../Middleware/upload";
import BlogVideoGenration from "../Service/BlogVideoGenration/BlogVideoGenration";
import StoryboardService from "../Service/BlogVideoGenration/StoryboardService";
import InstaStoryService from "../Service/BlogVideoGenration/InstaStoryService";
import BlogService from "../Service/BlogService/BlogService";
import { buildBlogContext } from "../Service/BlogVideoGenration/BlogContext";
import { IPreparedVideo } from "../Interface/ClassInterface/IBlogVideoGenration";

const parseJSON = (value: unknown) => {
    if (typeof value !== "string") return value ?? [];
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

// Takes a blogId plus the user's photos, videos, notes and thumbnails.
// Returns the reel storyboard and the Instagram Story suggestions, both built from the blog text and the uploaded media.
export const genrateVideo = async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const photos = files.filter((f) => f.mimetype.startsWith("image/"));
    const videos = files.filter((f) => f.mimetype.startsWith("video/"));
    const preparedVideos: IPreparedVideo[] = [];
    const tempFiles: string[] = [];

    try {
      console.log("Request body: ", req.body);
        const blogId = Number(req.body.blogId);
        if (!Number.isInteger(blogId) || blogId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid blogId" });
        }

        if (photos.length === 0 && videos.length === 0) {
            return res.status(400).json({ success: false, message: "No photos or videos uploaded" });
        }

        const { userName } = req.body;
        const photosMeta = parseJSON(req.body.photosMeta);
        const videosMeta = parseJSON(req.body.videosMeta);
        const thumbnails = parseJSON(req.body.thumbnails);

        if (photosMeta === null || videosMeta === null || thumbnails === null) {
            return res.status(400).json({ success: false, message: "Invalid JSON in meta fields" });
        }
        console.log("Blog Id  ", blogId);
        const blogResponse = await new BlogService().fetchBlogByID(blogId);
        if (!blogResponse.success || !blogResponse.data) {
            return res.status(404).json({ success: false, message: "Blog not found" });
        }
        const blog = buildBlogContext(blogResponse.data);

        const media = [
            ...photos.map((f, i) => ({
                media_id: `p${i + 1}`,
                type: "image" as const,
                mimeType: f.mimetype,
                note: photosMeta[i],
            })),
            ...videos.map((f, i) => ({
                media_id: `v${i + 1}`,
                type: "video" as const,
                mimeType: f.mimetype,
                note: videosMeta[i],
            })),
        ];

        const service = new BlogVideoGenration();

        const photoInputs = await Promise.all(
            photos.map(async (f, i) => {
                const resizedPath = await service.resizeImageTo1024px(f.path);
                tempFiles.push(resizedPath);
                return { media_id: `p${i + 1}`, resizedPath, note: photosMeta[i] };
            })
        );

        const videoInputs = [];
        for (let i = 0; i < videos.length; i++) {
            const prepared = await service.prepareVideo(videos[i].path, `v${i + 1}`);
            preparedVideos.push(prepared);
            videoInputs.push({ media_id: `v${i + 1}`, prepared, note: videosMeta[i] });
        }

        // Run one after the other: the Copilot runtime fails when two sessions are created at the same moment.
        const storyboard = await new StoryboardService().generateStoryboard({
            userName,
            thumbnails,
            blog,
            photos: photoInputs,
            videos: videoInputs,
        });

        let instaStory = null;
        let instaStoryError: string | undefined;
        try {
            instaStory = await new InstaStoryService().suggest({
                userName,
                thumbnails,
                blog,
                photos: photoInputs,
                videos: videoInputs,
            });
        } catch (error) {
            console.error("Insta story suggestion failed:", error);
            instaStoryError = (error as Error).message;
        }

        return res.json({
            success: true,
            blogId,
            tripTitle: blog.tripTitle,
            userName,
            thumbnails,
            media,
            storyboard,
            instaStory,
            instaStoryError,
        });
    } catch (error) {
        console.error("Video generation failed:", error);
        return res.status(500).json({
            success: false,
            message: (error as Error).message || "Failed to generate storyboard",
        });
    } finally {
        await Promise.all([
            ...preparedVideos.map((v) => v.cleanup()),
            ...[...files.map((f) => f.path), ...tempFiles].map((p) => fs.promises.rm(p, { force: true })),
        ]);
        // Remove the uploads folder once empty; skipped if another request still has files in it.
        try {
            const remaining = await fs.promises.readdir(uploadDir);
            if (remaining.length === 0) await fs.promises.rmdir(uploadDir);
        } catch {
            // folder missing or being used by another request
        }
    }
};
