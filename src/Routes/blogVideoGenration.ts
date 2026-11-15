import express from "express";
import { upload } from "../Middleware/upload";
import { genrateVideo } from "../Controller/BlogVideoGenration";
const router = express.Router();

// Accept any file field name; the controller sorts files by MIME type.
router.post("/genrate", upload.any(), genrateVideo);

export default router;