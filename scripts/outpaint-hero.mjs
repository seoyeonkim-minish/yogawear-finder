/**
 * Extends the 1:1 hero campaign still into a wide hero frame, so the clipped
 * shoe and hem at the bottom edge and the studio sweep above the models are
 * painted in rather than letterboxed.
 *
 *   GEMINI_API_KEY=… node scripts/outpaint-hero.mjs
 *
 * The key is read from the environment only — never a flag, never a file. The
 * SDK picks up GEMINI_API_KEY on its own, and the key's format is its business:
 * both the older AIza… and the current AQ… keys go over the same header.
 *
 * Writes public/hero-alpine-wide.png. Nothing reads it until lib/images.ts
 * points HERO_IMAGES[0] at it.
 */
import { readFile, writeFile } from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

const SRC = "public/hero-alpine.webp";
const OUT = "public/hero-alpine-wide.png";
const MODEL = "gemini-3.1-flash-image";

const PROMPT = `Outpaint this studio campaign photograph to a 16:9 landscape frame.
Keep: both models, their poses, faces, hair, garments, colours, the flat pink studio sweep and the lighting — identical where they already exist.
Add only what the original frame cut off: continue the pink sweep upward and outward, and complete the woman's lower leg, shoe and trouser hem where the bottom edge clips them.
No new people, props, text or logos. Photographic, same grain and the same soft studio light.`;

const ai = new GoogleGenAI({});

const interaction = await ai.interactions.create({
  model: MODEL,
  input: [
    { type: "text", text: PROMPT },
    { type: "image", mime_type: "image/webp", data: (await readFile(SRC)).toString("base64") },
  ],
  response_format: { type: "image", mime_type: "image/png", aspect_ratio: "16:9", image_size: "2K" },
});

const image = interaction.output_image;
if (!image) throw new Error("the model returned no image");

await writeFile(OUT, Buffer.from(image.data, "base64"));
console.log(`wrote ${OUT}`);
