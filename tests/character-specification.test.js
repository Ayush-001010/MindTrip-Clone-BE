const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const sharp = require("sharp");
const { buildCharacterSpecification } = require("../src/Service/Copilot/Agent/CartoonAgent/buildCharacterSpecification");
const { characterAnalysisResultSchema } = require("../src/Interface/DataInterface/ICharacterSpecification");
const CartoonAgent = require("../src/Service/Copilot/Agent/CartoonAgent/CartoonAgent").default;
const VisualAnalysisAgent = require("../src/Service/Copilot/Agent/CartoonAgent/VisualAnalysisAgent").default;
const SvgMascotAgent = require("../src/Service/Copilot/Agent/CartoonAgent/SvgMascotAgent").default;

const appearance = {
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
  uncertainties: ["Eyelids are partly obscured."],
};

const point = (index, x, y) => ({
  index, name: null, x, y, normalizedX: x / 500, normalizedY: y / 500,
});
const landmarks = [
  point(291, 65, 60), point(33, 20, 20), point(98, 40, 40),
  point(263, 80, 20), point(61, 35, 60), point(133, 40, 20),
  point(327, 60, 40), point(362, 60, 20),
];
const faceData = {
  image: { width: 500, height: 500 },
  face: {
    box: { xMin: 0, yMin: 0, xMax: 100, yMax: 200, width: 100, height: 200 },
    totalLandmarks: landmarks.length,
    landmarks,
  },
};

test("builds the requested structure with normalized image-space measurements", () => {
  const specification = buildCharacterSpecification(faceData, appearance);
  assert.deepEqual(specification.geometry.proportions, {
    faceWidthToHeight: 0.5,
    eyeSpacing: 0.4,
    noseWidth: 0.2,
    mouthWidth: 0.3,
  });
  assert.deepEqual(specification.appearance, appearance);
  assert.deepEqual(specification.geometry.landmarks, landmarks);
  assert.deepEqual(specification.uncertainties, appearance.uncertainties);
});

test("omits unavailable optional measurements and explains why", () => {
  const partial = { ...faceData, face: { ...faceData.face, landmarks: landmarks.filter((p) => p.index !== 291 && p.index !== 33) } };
  const specification = buildCharacterSpecification(partial, appearance);
  assert.equal(specification.geometry.proportions.mouthWidth, undefined);
  assert.equal(specification.geometry.proportions.eyeSpacing, undefined);
  assert.equal(specification.geometry.proportions.noseWidth, 0.2);
  assert.match(specification.uncertainties.join(" "), /Mouth width.*missing/);
  assert.match(specification.uncertainties.join(" "), /Eye spacing.*missing/);
});

test("rejects a face box without usable dimensions", () => {
  const invalid = { ...faceData, face: { ...faceData.face, box: { ...faceData.face.box, width: 0 } } };
  assert.throws(() => buildCharacterSpecification(invalid, appearance), /invalid face bounding box/);
});

test("rejects an absent or empty SVG result", () => {
  assert.equal(characterAnalysisResultSchema.safeParse({}).success, false);
  assert.equal(characterAnalysisResultSchema.safeParse({ svg: " " }).success, false);
});

test("saves each generated SVG without overwriting existing files and surfaces save errors", async () => {
  const originalCwd = process.cwd();
  const originalAnalyze = VisualAnalysisAgent.prototype.analyze;
  const originalGenerate = SvgMascotAgent.prototype.generate;
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "mascot-save-test-"));
  const output = path.join(temp, "output");
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
  try {
    process.chdir(temp);
    const agent = new CartoonAgent();
    agent.extractFaceLandmarks = async () => faceData;
    VisualAnalysisAgent.prototype.analyze = async () => appearance;
    const modes = [];
    SvgMascotAgent.prototype.generate = async (photo, map, specification, mode) => {
      modes.push({ mode, style: specification.illustration.style });
      return svg;
    };
    const image = await sharp({ create: { width: 500, height: 500, channels: 3, background: "white" } }).png().toBuffer();

    await fs.mkdir(output);
    await fs.writeFile(path.join(output, "cartoon-existing.svg"), "existing");
    const first = await agent.executeAgent("", [], image);
    const second = await agent.executeAgent("", [], image, "color");
    assert.deepEqual(characterAnalysisResultSchema.parse(first), { svg });
    assert.equal(second.svg, svg);
    assert.equal(modes[0].mode, "monochrome");
    assert.match(modes[0].style, /monochrome/i);
    assert.equal(modes[1].mode, "color");
    assert.match(modes[1].style, /color/i);
    const files = await fs.readdir(output);
    assert.equal(files.length, 3);
    assert.equal(await fs.readFile(path.join(output, "cartoon-existing.svg"), "utf8"), "existing");
    for (const file of files.filter((name) => name !== "cartoon-existing.svg")) {
      assert.match(file, /^cartoon-[0-9a-f-]+\.svg$/);
      assert.equal(await fs.readFile(path.join(output, file), "utf8"), svg);
    }

    for (const file of files) await fs.unlink(path.join(output, file));
    await fs.rmdir(output);
    await fs.writeFile(output, "not a directory");
    await assert.rejects(() => agent.executeAgent("", [], image));
  } finally {
    VisualAnalysisAgent.prototype.analyze = originalAnalyze;
    SvgMascotAgent.prototype.generate = originalGenerate;
    process.chdir(originalCwd);
    try {
      const entries = await fs.readdir(output);
      for (const file of entries) await fs.unlink(path.join(output, file));
      await fs.rmdir(output);
    } catch (error) {
      if (error.code === "ENOTDIR") await fs.unlink(output);
      else if (error.code !== "ENOENT") throw error;
    }
    await fs.rmdir(temp);
  }
});

test("HTTP and socket requests default to monochrome, forward color, and reject invalid modes", async () => {
  const express = require("express");
  const originalCwd = process.cwd();
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "mascot-mode-test-"));
  const memoriesId = require.resolve("../src/Service/Memories/Memories");
  const redisId = require.resolve("../src/Service/RedisService/RedisService");
  const uploadId = require.resolve("../src/Middleware/upload");
  const routeId = require.resolve("../src/Routes/blogVideoGenration");
  const socketId = require.resolve("../src/Socket/socketMemoriesOpt");
  const ids = [memoriesId, redisId, uploadId, routeId, socketId];
  const previous = new Map(ids.map((id) => [id, require.cache[id]]));
  const modes = [];
  let server;
  try {
    process.chdir(temp);
    require.cache[memoriesId] = {
      id: memoriesId, filename: memoriesId, loaded: true,
      exports: { __esModule: true, default: class {
        async convertImageToCartoon(file, mode) {
          modes.push(mode);
          return { success: true, data: { svg: "<svg/>" } };
        }
      } },
    };
    require.cache[redisId] = {
      id: redisId, filename: redisId, loaded: true,
      exports: { __esModule: true, default: class {} },
    };
    delete require.cache[uploadId];
    delete require.cache[routeId];
    delete require.cache[socketId];

    const app = express();
    app.use("/blogVideoGenration", require(routeId).default);
    server = await new Promise((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const image = await sharp({ create: { width: 10, height: 10, channels: 3, background: "white" } }).png().toBuffer();
    const request = async (mode) => {
      const body = new FormData();
      body.append("image", new Blob([image], { type: "image/png" }), "photo.png");
      if (mode !== undefined) body.append("colorMode", mode);
      return fetch(`http://127.0.0.1:${server.address().port}/blogVideoGenration/genrateCartoon`, { method: "POST", body });
    };
    assert.equal((await request()).status, 200);
    assert.equal((await request("color")).status, 200);
    assert.equal((await request("invalid")).status, 400);

    const handlers = {};
    const emitted = [];
    const socket = {
      on: (name, handler) => { handlers[name] = handler; },
      emit: (name, value) => { emitted.push({ name, value }); },
    };
    require(socketId).default({ on: (name, handler) => handler(socket) });
    await handlers["room:convertImageToCartoon"]({ image });
    await handlers["room:convertImageToCartoon"]({ image, colorMode: "color" });
    await handlers["room:convertImageToCartoon"]({ image, colorMode: "invalid" });
    assert.deepEqual(modes, ["monochrome", "color", "monochrome", "color"]);
    assert.equal(emitted[2].name, "room:convertImageToCartoon:error");
    assert.match(emitted[2].value, /colorMode/);
  } finally {
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    process.chdir(originalCwd);
    for (const id of ids) {
      if (previous.get(id)) require.cache[id] = previous.get(id);
      else delete require.cache[id];
    }
    const uploads = path.join(temp, "uploads");
    try {
      for (const file of await fs.readdir(uploads)) await fs.unlink(path.join(uploads, file));
      await fs.rmdir(uploads);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await fs.rmdir(temp);
  }
});
