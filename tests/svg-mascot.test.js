const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const CopilotClientFactory = require("../src/Factory/CopilotClientFactory").default;
const SvgMascotAgent = require("../src/Service/Copilot/Agent/CartoonAgent/SvgMascotAgent").default;
const { visualizeLandmarks } = require("../src/Service/Copilot/Agent/CartoonAgent/visualizeLandmarks");

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="black"/></svg>';
const specification = { version: "1.0", geometry: { imageWidth: 32, imageHeight: 32 }, uncertainties: [] };

async function withSession(response, run) {
  const original = CopilotClientFactory.getInstance;
  const calls = { aborted: 0, disconnected: 0 };
  CopilotClientFactory.getInstance = () => ({
    createSession: async (config) => {
      calls.config = config;
      return {
        sendAndWait: async (request, timeout) => {
          calls.request = request;
          calls.timeout = timeout;
          if (response instanceof Error) throw response;
          return response;
        },
        abort: async () => { calls.aborted++; },
        disconnect: async () => { calls.disconnected++; },
      };
    },
  });
  try {
    const image = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#ffffff" } }).jpeg().toBuffer();
    const map = await visualizeLandmarks(image, 32, 32, [{ index: 0, name: null, x: 16, y: 16, normalizedX: 0.5, normalizedY: 0.5 }]);
    await run(new SvgMascotAgent(), image, map, calls);
  } finally {
    CopilotClientFactory.getInstance = original;
  }
}

test("sends the photo, landmark image, fixed style reference and specification", async () => {
  await withSession({ data: { content: JSON.stringify({ svg, error: null }) } }, async (agent, image, map, calls) => {
    assert.equal(await agent.generate(image, map, specification), svg);
    const attachments = calls.request.attachments;
    assert.deepEqual(attachments.map((item) => item.displayName), ["user-photo.png", "landmark-map.png", "style-reference.png"]);
    assert.ok(attachments.every((item) => item.type === "blob" && item.mimeType === "image/png"));
    const photo = Buffer.from(attachments[0].data, "base64");
    const overlay = Buffer.from(attachments[1].data, "base64");
    assert.equal((await sharp(photo).metadata()).format, "png");
    assert.equal((await sharp(overlay).metadata()).format, "png");
    assert.equal((await sharp(Buffer.from(attachments[2].data, "base64")).metadata()).format, "png");
    assert.deepEqual(overlay, map);
    assert.notDeepEqual(overlay, photo);
    assert.ok(calls.request.prompt.includes(JSON.stringify(specification)));
    assert.match(calls.request.prompt, /Color mode: monochrome/);
    assert.match(calls.config.systemMessage.content, /only for general visual style/);
    assert.match(calls.config.systemMessage.content, /landmark-map.png/);
    assert.equal(calls.timeout, 180000);
    assert.equal(calls.aborted, 0);
    assert.equal(calls.disconnected, 1);
  });
});

test("forwards the color option to the generation request", async () => {
  await withSession({ data: { content: JSON.stringify({ svg, error: null }) } }, async (agent, image, map, calls) => {
    assert.equal(await agent.generate(image, map, specification, "color"), svg);
    assert.match(calls.request.prompt, /Color mode: color/);
  });
});

test("rejects malformed or failed model responses and releases the session", async () => {
  const outputs = [
    "",
    "not JSON",
    JSON.stringify({ svg: "", error: null }),
    JSON.stringify({ svg: null, error: "Cannot draw this image." }),
    JSON.stringify({ svg: "<svg", error: null }),
    JSON.stringify({ svg: "<svg>not a valid close", error: null }),
  ];
  for (const content of outputs) {
    await withSession({ data: { content } }, async (agent, image, map, calls) => {
      await assert.rejects(() => agent.generate(image, map, specification));
      assert.equal(calls.aborted, 1);
      assert.equal(calls.disconnected, 1);
    });
  }
});
