import { Request , Response } from "express";

export const fetchReel = async (req: Request, res: Response) => {
    const { placeName } = req.query;
    if (!placeName || typeof placeName !== "string") {
        return res.status(400).json({ error: "placeName query parameter is required" });
    }
    try {
        const ReelService = (await import("../Service/ReelService/ReelService")).default;
        const reelServiceInstance = new ReelService();
        const reels = await reelServiceInstance.fetchReel(placeName);
        return res.status(200).json(reels);
    } catch (error) {
        console.error("Error fetching reels:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}