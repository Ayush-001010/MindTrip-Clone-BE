import assert from "node:assert/strict";
import test from "node:test";
import { IMemoriesReelCreation } from "../../../Interface/ClassInterface/IMemories";
import { IReelScript } from "../../../Interface/DataInterface/IReelPlan";
import MemoriesChats from "../../../DB/Model/MemoriesChats";
import CreateMemories from "./CreateMemories";

const request: IMemoriesReelCreation = {
    memoryId: 1,
    roomId: 2,
    userName: "Traveller",
    userSuggestion: "End with a sunset",
    template: "Journey",
    soundtrack: "",
    mood: "Happy",
    pace: "Medium",
    place: ["Jibhi"],
};

const script: IReelScript = {
    version: 1, title: "Journey", template: "Journey", mood: "Happy", pace: "Medium",
    fps: 30, width: 1080, height: 1920, durationSec: 0, durationInFrames: 0,
    audio: null, scenes: [], pickedBy: "ai", warnings: [],
};

test("reel chat saves the user message then updates only its row with the script", async () => {
    const calls: unknown[] = [];
    const service = new CreateMemories();
    Object.assign(service, {
        dbInstanse: {
            fetchData: async (_table: string, _limit: unknown, _skip: unknown, where: object) => {
                calls.push(where);
                return { dataSuccess: true, data: [{ id: 2 }] };
            },
            createData: async (_table: string, data: object) => {
                calls.push(data);
                return { dataSuccess: true, data: { id: 42 } };
            },
            updateData: async (_table: string, data: object, where: object, returning: boolean) => {
                calls.push({ data, where, returning });
                return { dataSuccess: true, data: [1] };
            },
        },
    });

    const created = await service.createReelChat(request);
    assert.deepEqual(created, { success: true, data: 42 });
    assert.deepEqual(await service.updateReelChatResponse(42, script), { success: true, data: true });
    assert.deepEqual(calls, [
        { id: 2, memoryId: 1 },
        { memoryId: 1, roomId: 2, userMessage: "End with a sunset", userName: "Traveller", actionType: "Other" },
        { data: { botMessage: JSON.stringify(script) }, where: { id: 42 }, returning: false },
    ]);
});

test("reel chat rejects a room from another memory and missing update rows", async () => {
    const service = new CreateMemories();
    Object.assign(service, {
        dbInstanse: {
            fetchData: async () => ({ dataSuccess: true, data: [] }),
            updateData: async () => ({ dataSuccess: true, data: [0] }),
        },
    });
    assert.equal((await service.createReelChat(request)).success, false);
    assert.equal((await service.updateReelChatResponse(42, script)).success, false);
});

test("reel chat handles Sequelize's MySQL affected-row result", async (t) => {
    t.mock.method(MemoriesChats.queryInterface, "bulkUpdate", async () => 1);
    const service = new CreateMemories();
    assert.deepEqual(await service.updateReelChatResponse(42, script), { success: true, data: true });
});
