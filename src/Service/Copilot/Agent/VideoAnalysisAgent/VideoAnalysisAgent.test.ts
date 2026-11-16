import assert from "node:assert/strict";
import { test } from "node:test";
import type { CopilotSession, ModelInfo } from "@github/copilot-sdk";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import { HEAVY_MODEL } from "../../../../config/models";
import VideoAnalysisAgent from "./VideoAnalysisAgent";

const model: ModelInfo = {
    id: HEAVY_MODEL,
    name: HEAVY_MODEL,
    capabilities: {
        supports: { vision: true, reasoningEffort: false },
        limits: {
            max_context_window_tokens: 10000,
            vision: {
                supported_media_types: ["image/jpeg"],
                max_prompt_images: 8,
                max_prompt_image_size: 1000000,
            },
        },
    },
};

test("starts before listing models and shares initialization across concurrent tags", async t => {
    const client = CopilotClientFactory.getInstance();
    const calls: string[] = [];
    t.mock.method(client, "start", async () => { calls.push("start"); });
    t.mock.method(client, "listModels", async () => {
        assert.deepEqual(calls, ["start"]);
        calls.push("listModels");
        return [model];
    });
    const agent = new VideoAnalysisAgent();
    assert.deepEqual(await Promise.all([agent.frameBudget(), agent.frameBudget()]), [8, 8]);
    assert.equal(await agent.frameBudget(), 8);
    assert.deepEqual(calls, ["start", "listModels"]);
});

test("startup errors propagate and a later call can retry", async t => {
    const client = CopilotClientFactory.getInstance();
    let attempts = 0;
    t.mock.method(client, "start", async () => {
        if (++attempts === 1) throw new Error("Runtime unavailable");
    });
    t.mock.method(client, "listModels", async () => [model]);
    const agent = new VideoAnalysisAgent();
    await assert.rejects(agent.frameBudget(), /Runtime unavailable/);
    assert.equal(await agent.frameBudget(), 8);
    assert.equal(attempts, 2);
});

test("a stuck model lookup reports a timeout instead of waiting indefinitely", async t => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const client = CopilotClientFactory.getInstance();
    t.mock.method(client, "start", async () => {});
    t.mock.method(client, "listModels", () => new Promise<ModelInfo[]>(() => {}));
    const pending = assert.rejects(new VideoAnalysisAgent().frameBudget(), /timed out after 30 seconds/);
    await Promise.resolve();
    t.mock.timers.tick(30000);
    await pending;
});

test("single-image models receive one real contact sheet for each analysis pass", async t => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "video-contact-sheet-"));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const frames = [];
    for (let index = 0; index < 4; index++) {
        const framePath = path.join(dir, `${index}.jpg`);
        await sharp({
            create: { width: 160, height: 90, channels: 3, background: index % 2 ? "#00ff00" : "#ff0000" },
        }).jpeg().toFile(framePath);
        frames.push({ path: framePath, timestamp: index + 1 });
    }

    const singleImageModel = structuredClone(model);
    singleImageModel.capabilities.limits.vision = {
        max_prompt_images: 1, max_prompt_image_size: 1000000, supported_media_types: ["image/jpeg"],
    };
    const client = CopilotClientFactory.getInstance();
    t.mock.method(client, "start", async () => {});
    t.mock.method(client, "listModels", async () => [singleImageModel]);
    type Request = Parameters<CopilotSession["sendAndWait"]>[0];
    const requests: Request[] = [];
    let disconnected = 0;
    t.mock.method(client, "createSession", async () => ({
        sendAndWait: async (request: Request) => {
            requests.push(request);
            return { data: { content: '{"segments":[]}' } };
        },
        disconnect: async () => { disconnected++; },
    }));

    const agent = new VideoAnalysisAgent();
    assert.equal(await agent.frameBudget(), 8);
    const context = { videoId: 42, tag: "Beach", duration: 5, start: 0, end: 5, transcript: [] };
    await agent.analyse({ ...context, pass: "coarse", frames });
    await agent.analyse({ ...context, pass: "confirmation", frames: frames.slice(0, 2) });
    assert.equal(disconnected, 2);
    for (const [index, request] of requests.entries()) {
        assert.equal(request.attachments?.length, 1);
        const attachment = request.attachments[0];
        assert.equal(attachment.type, "blob");
        if (attachment.type !== "blob") throw new Error("Expected contact sheet");
        const sheet = Buffer.from(attachment.data, "base64");
        const metadata = await sharp(sheet).metadata();
        assert.equal(metadata.format, "jpeg");
        assert.equal(metadata.width, index === 0 ? 960 : 640);
        assert.equal(metadata.height, index === 0 ? 480 : 240);
        assert.ok(sheet.length <= 1000000);
        const context = JSON.parse(request.prompt);
        assert.match(context.frameLayout, /contact sheet/);
        assert.deepEqual(context.frames[0], { frameNumber: 1, timestamp: 1 });
    }
});
