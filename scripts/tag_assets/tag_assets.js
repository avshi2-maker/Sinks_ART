#!/usr/bin/env node
/**
 * tag_assets.js — AI-powered asset tagger for sink_media
 *
 * Reads a local folder of images, sends each one to Claude Sonnet vision
 * with the 9-facet schema, uploads original to Cloudinary, and writes a
 * fully-tagged row to sink_media in the shared Sinks_ART Supabase.
 *
 * USAGE:
 *   node tag_assets.js --folder=C:\SinkS\assets_intake\extracted
 *   node tag_assets.js --folder=./test --dry-run
 *   node tag_assets.js --folder=./test --limit=5
 *   node tag_assets.js --folder=./test --force      (re-tag already-tagged files)
 *
 * EXPECTS in .env.local (project root):
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (or CLOUDINARY_CLOUD_NAME)
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   ANTHROPIC_API_KEY                  ← NEW for tagger
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname, resolve } from "node:path";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

// =====================================================================
// CONFIG
// =====================================================================

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Claude Sonnet 4.6 pricing (May 2026)
const CLAUDE_INPUT_PER_MTOK = 3.0;
const CLAUDE_OUTPUT_PER_MTOK = 15.0;

const CLOUDINARY_FOLDER = "sink_media";  // all uploaded assets land here

// =====================================================================
// LOAD ENVIRONMENT
// =====================================================================

const ENV_CANDIDATES = [
  "./.env.local",                    // run from project root
  "../../.env.local",                 // run from scripts/tag_assets/
  "../.env.local",                    // run from scripts/
  "./scripts/tag_assets/.env.local",
];
let envPath = null;
for (const path of ENV_CANDIDATES) {
  if (existsSync(path)) {
    dotenv.config({ path });
    envPath = resolve(path);
    break;
  }
}
if (!envPath) {
  console.error("✗ No .env.local found. Looked in:", ENV_CANDIDATES);
  process.exit(1);
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET;

// Detect dry-run mode early so we can skip upload-related env checks
const IS_DRY_RUN = process.argv.some(a => a === "--dry-run" || a === "--dry-run=true");

const missing = [];
if (!ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
if (!IS_DRY_RUN) {
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY (or SERVICE_ROLE_KEY)");
  if (!CLOUDINARY_CLOUD) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  if (!CLOUDINARY_KEY) missing.push("CLOUDINARY_API_KEY");
  if (!CLOUDINARY_SECRET) missing.push("CLOUDINARY_API_SECRET");
}
if (missing.length) {
  console.error(`✗ Missing env vars in ${envPath}:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

// =====================================================================
// VISION PROMPT (the heart of the tagger)
// =====================================================================

const VISION_PROMPT = `You are a marble sink asset tagger for the Marble Art Sinks business.
Analyze this image and return JSON only — no preamble, no markdown fences.

Use EXACTLY these enum values. If unsure or not applicable, use the "unknown" value where listed, or null where allowed.

{
  "subject_type": one of ["finished_sink", "marble_sample", "workshop_process", "portrait", "bathroom_scene", "competitor_research", "concept_render", "sketch", "other"],
  "sink_config": one of ["dual_pitch", "single_pitch", "double_basin", "with_cabinet", "wall_mounted", "freestanding", "extra_wide", "mixed", "unknown"] or null,
  "marble_family": one of ["white", "beige", "cream", "grey", "black", "green", "brown", "red", "blue", "multi_color", "unknown"] or null,
  "veining_intensity": one of ["none", "subtle", "moderate", "dramatic", "unknown"] or null,
  "room_context": one of ["installed_bathroom", "installed_kitchen", "workshop", "studio_isolated", "outdoor", "unknown"] or null,
  "media_type": one of ["photo", "video", "sketch_scan", "ai_render", "3d_model"],
  "quality_tier": one of ["hero", "supporting", "reference_only", "archive"],
  "media_source": one of ["ales_workshop", "customer_install", "nano_banana", "competitor_aliexpress", "pinterest_ref", "dealer_photo", "other"],
  "has_people": boolean,
  "caption_he": short Hebrew description (1 sentence),
  "caption_en": short English description (1 sentence),
  "confidence": float between 0.0 and 1.0,
  "reasoning": 2-3 sentence explanation of your classification choices
}

========================================================================
STEP 1 — PROVENANCE FIRST (do this before all other classification!)
========================================================================

Before deciding anything else, ask yourself: IS THIS AN AI-GENERATED IMAGE?

Signs an image is AI-GENERATED (Nano Banana / Gemini / similar):
- Surfaces are unnaturally clean — no dust, no water droplets, no fingerprints
- Lighting is "studio-perfect" with no harsh real-world shadows
- Edges are geometrically pristine — no chips, no asymmetries, no fabrication marks
- Background is sparse and intentional, often a clean wall or vanity with deliberately-placed minimal decor (e.g., 2-3 succulents, a single brass tray, a small plant)
- The composition feels like a 3D render or product catalog mockup
- Surrounding materials (walls, floors, fixtures) all look brand-new and color-coordinated
- Often a small star/sparkle watermark or generation indicator in a corner
- "Too perfect" overall feel

Signs an image is a REAL PHOTO of a finished sink:
- Real-world imperfections: dust specks, light water marks, slight scratches, edges that look hand-finished
- Asymmetries in lighting (real sun through real windows)
- Environmental clutter at the frame edges — outlets, light switches, towel hooks, real bathroom items
- Photo metadata feel: handheld angle, real depth-of-field artifacts, possibly slight blur
- Walls have real texture variation, not flat color
- Could plausibly be taken on a smartphone

DECISION RULE:
- If 3+ "AI-generated" signs present → subject_type="concept_render", media_type="ai_render", media_source="nano_banana"
- If 3+ "real photo" signs present → subject_type="finished_sink", media_type="photo", media_source="ales_workshop"
- If genuinely ambiguous → "concept_render" is safer (be cautious about claiming Ales made something he didn't)

========================================================================
STEP 2 — CLASSIFICATION RULES FOR OTHER SUBJECT TYPES
========================================================================

- Hand-drawn line art on paper, graph paper, sketchpad → subject_type="sketch", media_type="sketch_scan"
- Cheap-looking ceramic sinks with watermarks, stock-photo aesthetic, often from AliExpress-style sites → subject_type="competitor_research", media_source="competitor_aliexpress", quality_tier="reference_only"
- Marble slabs, raw stone samples, dealer catalog shots of stone (no sink visible) → subject_type="marble_sample", media_source="dealer_photo"
- People actively working with tools, hands on stone, sink in mid-fabrication → subject_type="workshop_process", room_context="workshop"
- Human faces or full bodies as the primary subject → subject_type="portrait", has_people=true

========================================================================
STEP 3 — QUALITY TIER
========================================================================

- "hero" = professional-looking, well-lit, clean composition, suitable for marketing landing page
- "supporting" = good quality but secondary (close-ups, detail shots, alternate angles)
- "reference_only" = internal use only — competitor research, low-quality references, customer-sent inspirations
- "archive" = old photos kept for record but not for active use

Output ONLY the JSON object. No other text.`;

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq >= 0) {
        args[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        args[arg.slice(2)] = true;
      }
    }
  }
  return args;
}

async function getImagesInFolder(folder) {
  const images = [];
  const entries = await readdir(folder, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(folder, entry.name);
    if (entry.isFile() && SUPPORTED_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
      images.push(full);
    } else if (entry.isDirectory()) {
      const sub = await getImagesInFolder(full);
      images.push(...sub);
    }
  }
  return images;
}

async function isAlreadyTagged(supabase, filename) {
  const { data, error } = await supabase
    .from("sink_media")
    .select("id")
    .eq("original_filename", filename)
    .limit(1);
  if (error) throw new Error(`Supabase check failed: ${error.message}`);
  return data && data.length > 0;
}

function parseJsonResponse(text) {
  // Strip markdown fences if model added them despite instructions
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  return JSON.parse(cleaned);
}

// Anthropic vision API limit: 5 MB per base64-encoded image.
// We resize anything >4 MB to max 2048px on longest side, output as JPEG quality 85.
const API_SIZE_LIMIT_MB = 4.5;
const RESIZE_MAX_PX = 2048;
const RESIZE_JPEG_QUALITY = 85;

async function prepareImageForAPI(imagePath) {
  const buffer = await readFile(imagePath);
  const originalMB = buffer.length / (1024 * 1024);
  const ext = extname(imagePath).toLowerCase();

  // Small enough — send as-is
  if (originalMB < API_SIZE_LIMIT_MB) {
    return {
      base64: buffer.toString("base64"),
      mediaType: MIME_BY_EXT[ext] || "image/jpeg",
      resized: false,
      originalMB,
      sentMB: originalMB,
    };
  }

  // Too large — resize to fit within RESIZE_MAX_PX, output as JPEG
  const resized = await sharp(buffer)
    .resize(RESIZE_MAX_PX, RESIZE_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: RESIZE_JPEG_QUALITY })
    .toBuffer();

  return {
    base64: resized.toString("base64"),
    mediaType: "image/jpeg",
    resized: true,
    originalMB,
    sentMB: resized.length / (1024 * 1024),
  };
}

async function tagImage(anthropic, imagePath) {
  const { base64, mediaType, resized, originalMB, sentMB } = await prepareImageForAPI(imagePath);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: VISION_PROMPT },
      ],
    }],
  });

  const text = response.content[0].text;
  const tags = parseJsonResponse(text);

  // Folder-based source-of-truth override.
  // When file lives in a folder whose name encodes provenance, trust the folder
  // over vision (Nano Banana renders can fool vision when they're highly realistic).
  const folderHint = imagePath.toLowerCase();
  let overrideApplied = null;
  if (folderHint.includes("nano") || folderHint.includes("banana")) {
    if (tags.media_source !== "nano_banana" || tags.subject_type !== "concept_render") {
      overrideApplied = `nano_banana (folder: ${imagePath.match(/[^\\\/]*[\\\/][^\\\/]+$/)?.[0] ?? "n/a"})`;
      tags.media_source = "nano_banana";
      tags.subject_type = "concept_render";
      tags.media_type = "ai_render";
    }
  } else if (folderHint.includes("competitor") || folderHint.includes("aliexpress") || folderHint.includes("chine")) {
    if (tags.media_source !== "competitor_aliexpress") {
      overrideApplied = `competitor_aliexpress (folder hint)`;
      tags.media_source = "competitor_aliexpress";
      tags.subject_type = "competitor_research";
      tags.quality_tier = "reference_only";
    }
  } else if (folderHint.includes("sketch") || folderHint.includes("drawing")) {
    if (tags.media_type !== "sketch_scan") {
      overrideApplied = `sketch_scan (folder hint)`;
      tags.subject_type = "sketch";
      tags.media_type = "sketch_scan";
    }
  }

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cost = (inputTokens * CLAUDE_INPUT_PER_MTOK + outputTokens * CLAUDE_OUTPUT_PER_MTOK) / 1_000_000;

  return { tags, cost, inputTokens, outputTokens, raw: response, resized, originalMB, sentMB, overrideApplied };
}

async function uploadToCloudinary(imagePath, tags) {
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: CLOUDINARY_FOLDER,
    use_filename: true,
    unique_filename: true,
    tags: [tags.subject_type, tags.marble_family, tags.quality_tier, tags.media_source].filter(Boolean),
    context: {
      caption_he: tags.caption_he || "",
      caption_en: tags.caption_en || "",
      subject_type: tags.subject_type || "",
    },
  });
  return result;
}

async function insertSinkMedia(supabase, imagePath, tags, cloudinaryResult, raw, cost) {
  const filename = basename(imagePath);
  const stats = await stat(imagePath);
  const ext = extname(filename).toLowerCase();

  const row = {
    cloudinary_url: cloudinaryResult.secure_url,
    cloudinary_public_id: cloudinaryResult.public_id,
    original_filename: filename,
    file_size_bytes: stats.size,
    width_px: cloudinaryResult.width,
    height_px: cloudinaryResult.height,
    mime_type: MIME_BY_EXT[ext] || null,

    // 9 facets
    subject_type: tags.subject_type,
    sink_config: tags.sink_config,
    marble_family: tags.marble_family,
    veining_intensity: tags.veining_intensity,
    room_context: tags.room_context,
    media_type: tags.media_type,
    quality_tier: tags.quality_tier || "supporting",
    media_source: tags.media_source,
    has_people: tags.has_people === true,

    // Captions
    caption_he: tags.caption_he || null,
    caption_en: tags.caption_en || null,

    // AI audit
    ai_tagged_at: new Date().toISOString(),
    ai_model: "claude-sonnet-4-6",
    ai_confidence: tags.confidence ?? null,
    ai_raw_output: {
      tags,
      reasoning: tags.reasoning,
      cost_usd: cost,
      tokens: { input: raw.usage.input_tokens, output: raw.usage.output_tokens },
    },
    human_reviewed: false,

    // Defaults
    custom_tags: [],
    metadata: {},
    is_archived: false,
    is_published: false,
  };

  const { data, error } = await supabase.from("sink_media").insert(row).select().single();
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data;
}

// =====================================================================
// MAIN
// =====================================================================

async function main() {
  const args = parseArgs(process.argv);
  const folder = resolve(args.folder || "./assets_intake");
  const dryRun = args["dry-run"] === true;
  const limit = args.limit ? parseInt(args.limit, 10) : null;
  const force = args.force === true;

  console.log("════════════════════════════════════════════════════");
  console.log("  tag_assets.js — Marble Art Sinks asset tagger");
  console.log("════════════════════════════════════════════════════");
  console.log(`Folder:   ${folder}`);
  console.log(`Mode:     ${dryRun ? "DRY RUN (no upload/insert)" : "LIVE"}`);
  if (limit) console.log(`Limit:    first ${limit} images`);
  if (force) console.log(`Force:    re-tagging already-tagged files`);
  console.log(`Env from: ${envPath}`);
  console.log("");

  if (!existsSync(folder)) {
    console.error(`✗ Folder not found: ${folder}`);
    process.exit(1);
  }

  const images = await getImagesInFolder(folder);
  console.log(`Found ${images.length} images`);
  const toProcess = limit ? images.slice(0, limit) : images;
  console.log(`Processing ${toProcess.length}\n`);

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  let supabase = null;
  if (!dryRun) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    cloudinary.config({ cloud_name: CLOUDINARY_CLOUD, api_key: CLOUDINARY_KEY, api_secret: CLOUDINARY_SECRET });
  }

  let stats = { tagged: 0, skipped: 0, errors: 0, totalCost: 0 };

  for (let i = 0; i < toProcess.length; i++) {
    const imagePath = toProcess[i];
    const filename = basename(imagePath);
    const prefix = `[${String(i + 1).padStart(3, " ")}/${toProcess.length}] ${filename.padEnd(40)}`;

    try {
      if (!force && !dryRun) {
        const exists = await isAlreadyTagged(supabase, filename);
        if (exists) {
          console.log(`${prefix} SKIP (already tagged)`);
          stats.skipped++;
          continue;
        }
      }

      const { tags, cost, inputTokens, outputTokens, raw, resized, originalMB, sentMB, overrideApplied } = await tagImage(anthropic, imagePath);
      stats.totalCost += cost;

      const sizeNote = resized ? ` [resized ${originalMB.toFixed(1)}→${sentMB.toFixed(1)}MB]` : "";
      const summary = `${tags.subject_type}/${tags.marble_family || "n/a"}/src=${tags.media_source} conf=${(tags.confidence || 0).toFixed(2)} $${cost.toFixed(4)}${sizeNote}`;

      if (dryRun) {
        console.log(`${prefix} DRY ${summary}`);
        if (overrideApplied) console.log(`         OVERRIDE: ${overrideApplied}`);
        if (tags.reasoning) console.log(`         REASONING: ${tags.reasoning}`);
        continue;
      }

      const uploaded = await uploadToCloudinary(imagePath, tags);
      await insertSinkMedia(supabase, imagePath, tags, uploaded, raw, cost);

      console.log(`${prefix} ✓ ${summary}`);
      stats.tagged++;
    } catch (err) {
      console.log(`${prefix} ✗ ERROR: ${err.message}`);
      stats.errors++;
    }
  }

  console.log("\n════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("════════════════════════════════════════════════════");
  console.log(`  Tagged:    ${stats.tagged}`);
  console.log(`  Skipped:   ${stats.skipped}`);
  console.log(`  Errors:    ${stats.errors}`);
  console.log(`  API cost:  $${stats.totalCost.toFixed(4)} USD`);
  console.log("════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
