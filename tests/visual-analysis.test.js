const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const CopilotClientFactory = require("../src/Factory/CopilotClientFactory").default;
const VisualAnalysisAgent = require("../src/Service/Copilot/Agent/CartoonAgent/VisualAnalysisAgent").default;
const { faceAnalysisResultSchema } = require("../src/Interface/DataInterface/IFaceLandmarks");

const validAnalysis = {
  faceShape: { type: "oval", description: "Soft outline", confidence: 0.8 },
  faceProportions: { forehead: "Broad", cheekbones: "Soft", jawline: "Rounded", chin: "Rounded" },
  eyes: { shape: "Almond", size: "Medium", spacing: "Average", eyelid: "Uncertain", description: "Expressive", confidence: 0.6 },
  eyebrows: { shape: "Arched", thickness: "Medium", curvature: "Gentle", description: "Soft arches" },
  nose: { bridge: "Straight", width: "Medium", tip: "Rounded", description: "Small rounded tip" },
  lips: { shape: "Curved", upperLip: "Thin", lowerLip: "Full", width: "Medium" },
  hair: { style: "Long", texture: "Wavy", volume: "Full", hairline: "Parted", color: "Dark" },
  facialHair: { beard: "not visible", moustache: "not visible", sideburns: "not visible" },
  expression: { type: "Smile", description: "Closed-mouth smile" },
  distinctiveFeatures: [],
  uncertainties: ["Facial hair is obscured.", "Eyelids are partly obscured."],
};
const faceData = {
  image: { width: 4, height: 3 },
  face: {
    box: { xMin: 1, yMin: 1, xMax: 3, yMax: 2, width: 2, height: 1 },
    totalLandmarks: 1,
    landmarks: [{ index: 0, name: null, x: 2, y: 1, normalizedX: 0.5, normalizedY: 1 / 3 }],
  },
};

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
    const image = await sharp({
      create: { width: 4, height: 3, channels: 3, background: "#ffffff" },
    }).jpeg().toBuffer();
    await run(new VisualAnalysisAgent(), image, calls);
  } finally {
    CopilotClientFactory.getInstance = original;
  }
}

test("sends the photo and returns a validated appearance specification", async () => {
  await withSession({ data: { content: JSON.stringify(validAnalysis) } }, async (agent, image, calls) => {
    assert.deepEqual(await agent.analyze(image, faceData), validAnalysis);
    assert.equal(calls.request.attachments.length, 1);
    assert.equal(calls.request.attachments[0].mimeType, "image/png");
    const photo = Buffer.from(calls.request.attachments[0].data, "base64");
    assert.equal((await sharp(photo).metadata()).format, "png");
    assert.match(calls.config.systemMessage.content, /uncertainties/);
    assert.match(calls.request.prompt, /x=1 to 3, y=1 to 2/);
    assert.equal(calls.timeout, 180000);
    assert.equal(calls.aborted, 0);
    assert.equal(calls.disconnected, 1);
  });
});

test("preserves the full appearance structure alongside landmarks", () => {
  const parsed = faceAnalysisResultSchema.parse({ ...faceData, visualAnalysis: validAnalysis });
  assert.deepEqual(parsed.visualAnalysis, validAnalysis);
  assert.deepEqual(parsed.face, faceData.face);
});

test("rejects malformed or incomplete output and cleans up the session", async () => {
  const invalid = [
    { content: "" },
    { content: "not JSON" },
    { content: JSON.stringify({ faceShape: validAnalysis.faceShape }) },
    { content: JSON.stringify({ ...validAnalysis, eyes: { ...validAnalysis.eyes, confidence: 1.5 } }) },
    { content: JSON.stringify({ ...validAnalysis, uncertainties: "unclear" }) },
  ];
  for (const data of invalid) {
    await withSession({ data }, async (agent, image, calls) => {
      await assert.rejects(() => agent.analyze(image, faceData), /Visual analysis returned/);
      assert.equal(calls.aborted, 1);
      assert.equal(calls.disconnected, 1);
    });
  }
});

test("propagates SDK failures and cleans up the session", async () => {
  await withSession(new Error("SDK failure"), async (agent, image, calls) => {
    await assert.rejects(() => agent.analyze(image, faceData), /SDK failure/);
    assert.equal(calls.aborted, 1);
    assert.equal(calls.disconnected, 1);
  });
});
