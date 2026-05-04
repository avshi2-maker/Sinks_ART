/**
 * claudeVision.ts
 *
 * Server-side wrapper for Claude's vision API (Anthropic Messages API).
 * Takes an image URL + a Hebrew prompt → returns structured JSON.
 *
 * IMPORTANT: This file runs server-side only. The ANTHROPIC_API_KEY env var
 * has no NEXT_PUBLIC_ prefix on purpose — Next.js will refuse to expose it
 * to the browser. Anything calling this must be inside an API route, a
 * Server Component, or a server action.
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 * Model:   claude-sonnet-4-6 (retirement no sooner than Feb 17, 2027)
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Locked model. Update this single constant when a longer-lived successor ships.
export const VISION_MODEL = 'claude-sonnet-4-6';

// Hard cap on output tokens — guardrail against runaway/buggy prompts.
// 1500 tokens is plenty for our structured-extraction JSON.
export const MAX_OUTPUT_TOKENS = 1500;

// Sonnet 4-6 pricing (verified May 2026): $3 per 1M input tokens, $15 per 1M output tokens.
const PRICE_INPUT_PER_M  = 3.00;
const PRICE_OUTPUT_PER_M = 15.00;

/** Result returned from a vision analysis. */
export interface VisionAnalysisResult {
  rawText:       string;                  // raw text response from Claude (likely JSON we'll parse downstream)
  parsedJson:    Record<string, unknown> | null;  // attempted JSON.parse of rawText, null if not parseable
  inputTokens:   number;
  outputTokens:  number;
  apiCostUsd:    number;                  // computed cost of this single call
  model:         string;                  // model used (echoed for the DB record)
}

export interface VisionAnalysisOptions {
  imageUrl:    string;          // public URL fetchable by Anthropic (Cloudinary URL works)
  prompt:      string;          // the analysis prompt (Hebrew, instruct Claude to return JSON only)
  systemText?: string;          // optional system instruction
  maxTokens?:  number;          // override default cap (still bounded by MAX_OUTPUT_TOKENS)
}

/**
 * Call Claude vision with a single image and a text prompt.
 * Throws on any non-2xx response — caller decides how to handle the error.
 */
export async function analyzeImage(opts: VisionAnalysisOptions): Promise<VisionAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in .env.local (server-side only)');
  }
  if (!opts.imageUrl) throw new Error('analyzeImage: imageUrl is required');
  if (!opts.prompt)   throw new Error('analyzeImage: prompt is required');

  const maxTokens = Math.min(opts.maxTokens ?? MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS);

  const body: Record<string, unknown> = {
    model:      VISION_MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: opts.imageUrl } },
          { type: 'text',  text: opts.prompt },
        ],
      },
    ],
  };
  if (opts.systemText) body.system = opts.systemText;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type':       'application/json',
      'x-api-key':          apiKey,
      'anthropic-version':  ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Claude API error (${res.status}): ${errBody.slice(0, 500)}`);
  }

  const data = await res.json();

  // Extract text from the structured response. Claude returns:
  //   { content: [ { type: 'text', text: '...' } ], usage: { input_tokens, output_tokens }, ... }
  const contentBlocks: Array<{ type: string; text?: string }> = data.content || [];
  const rawText = contentBlocks
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text!)
    .join('\n')
    .trim();

  // Try to parse the response as JSON. We strip the common ```json fence if present.
  let parsedJson: Record<string, unknown> | null = null;
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    // Caller can decide whether non-JSON output is acceptable.
    parsedJson = null;
  }

  const inputTokens  = Number(data.usage?.input_tokens  ?? 0);
  const outputTokens = Number(data.usage?.output_tokens ?? 0);
  const apiCostUsd =
    (inputTokens  / 1_000_000) * PRICE_INPUT_PER_M +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;

  return {
    rawText,
    parsedJson,
    inputTokens,
    outputTokens,
    apiCostUsd: Number(apiCostUsd.toFixed(6)),
    model: data.model || VISION_MODEL,
  };
}

/** Quick env check used by the API route to fail-fast with a nice error. */
export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}