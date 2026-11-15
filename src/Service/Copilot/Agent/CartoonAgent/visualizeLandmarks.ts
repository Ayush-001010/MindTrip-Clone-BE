import sharp from "sharp";
import type { IFaceLandmarks } from "../../../../Interface/DataInterface/IFaceLandmarks";

type Point = IFaceLandmarks["face"]["landmarks"][number];

export async function visualizeLandmarks(
  imageBuffer: Buffer,
  width: number,
  height: number,
  landmarks: Point[],
): Promise<Buffer> {
  const circles = landmarks.map((point) =>
    `<circle cx="${point.x}" cy="${point.y}" r="2" fill="#00ff88" stroke="#003322" stroke-width="0.5" />`,
  ).join("");

  const seen = new Set<string>();
  const labels = landmarks.flatMap((point) => {
    if (!point.name || seen.has(point.name)) {
      return [];
    }
    seen.add(point.name);
    const name = point.name.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    })[character] ?? character);
    return [`<text x="${point.x + 5}" y="${point.y - 5}" font-size="11" fill="#ff3333">${name}</text>`];
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${labels}${circles}</svg>`;
  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
