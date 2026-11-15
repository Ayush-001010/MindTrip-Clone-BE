import express from "express";
import multer from "multer";
import { upload } from "../Middleware/upload";
import { genrateVideo } from "../Controller/BlogVideoGenration";
import Memories from "../Service/Memories/Memories";
import { mascotColorModeSchema } from "../Interface/DataInterface/ICharacterSpecification";
const router = express.Router();

// Accept any file field name; the controller sorts files by MIME type.
router.post("/genrate", upload.any(), genrateVideo);

router.post("/genrateCartoon", (req, res) => {
    upload.any()(req, res, async (error: unknown) => {
        if (error) {
            console.error("Cartoon image upload failed:", error);
            const message = error instanceof multer.MulterError && error.code === "MISSING_FIELD_NAME"
                ? 'The file field name is missing. Use a multipart field named "image".'
                : error instanceof Error ? error.message : "Image upload failed.";
            res.status(400).json({ success: false, error: message });
            return;
        }

        const files = req.files;
        const file = Array.isArray(files) ? files[0] : undefined;
        if (!file) {
            res.status(400).json({ success: false, error: "Image is required." });
            return;
        }

        const colorMode = mascotColorModeSchema.default("monochrome").safeParse(req.body?.colorMode);
        if (!colorMode.success) {
            res.status(400).json({ success: false, error: 'colorMode must be "monochrome" or "color".' });
            return;
        }

        try {
            const memoriesInstance = new Memories();
            const resultAgent = await memoriesInstance.convertImageToCartoon(file.path, colorMode.data);
            if (!resultAgent.success) {
                res.status(502).json(resultAgent);
                return;
            }

            res.status(200).json(resultAgent);
        } catch (error) {
            console.error("Cartoon conversion failed:", error);
            res.status(500).json({ success: false, error: "Failed to convert the image to a cartoon." });
        }
    });
});
export default router;