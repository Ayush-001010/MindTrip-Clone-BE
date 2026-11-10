import Memories from "../Service/Memories/Memories";
import { Request, Response } from "express";

export const createNewMemory = async (req : Request , res : Response) => {
    const memoriesService = new Memories();
    const { userId, name } = req.body;
    try {
        const result = await memoriesService.createNewMemory(userId, name);
        res.send(result);
    } catch (error: any) {
        res.send({ error: error.message });
    }
}

export const fetchMemory = async (req : Request , res : Response) => {
    const memoriesService = new Memories();
    const { userId } = req.query as { userId: string };
    try {
        const result = await memoriesService.fetchMemory(parseInt(userId));
        res.send(result);
    } catch (error: any) {
        res.send({ error: error.message });
    }
}