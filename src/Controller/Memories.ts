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

export const inviteUser = async (req : Request , res : Response) => {
    const memoriesService = new Memories();
    const {userName, workId, base62 } = req.body;
    try {
        const result = await memoriesService.inviteUser(userName, workId, base62);
        res.send(result);
    } catch (error: any) {
        res.send({ error: error.message });
    }
}

export const fetchParticularMemoryDetails = async (req : Request , res : Response) => {
    const memoriesService = new Memories();
    const { workId } = req.query as { workId: string };
    try {
        const result = await memoriesService.fetchParticularMemoryDetails(workId);
        res.send(result);
    } catch (error: any) {
        res.send({ error: error.message });
    }
}

export const fetchParticularMemoryDetailsForInvite = async (req : Request , res : Response) => {
    const memoriesService = new Memories();
    const { base62 } = req.query as { base62: string };
    try {
        const result = await memoriesService.fetchParticularMemoryDetailsForInvite(base62);
        res.send(result);
    } catch (error: any) {
        res.send({ error: error.message });
    }
}

export const userAddedToMemory = async (req : Request , res : Response) => {
    const memoriesService = new Memories();
    const { userId, base62 } = req.body;
    try {
        const result = await memoriesService.userAddedToMemory(userId, base62);
        res.send(result);
    } catch (error: any) {
        res.send({ error: error.message });
    }
}