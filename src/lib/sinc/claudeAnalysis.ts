/**
 * src/lib/sinc/claudeAnalysis.ts
 *
 * Server-side Anthropic API wrapper for SinC-ART call analysis.
 * Uses fetch() directly (no SDK dependency) — matches the pattern
 * established by src/lib/intake/claudeVision.ts in Phase 15.
 *
 * SECURITY: This file imports process.env.ANTHROPIC_API_KEY and must
 * NEVER be imported from a client-side ("use client") component.
 * Only the /api/sinc-analyze route should import this.
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 */

import { callAnalysisSystemPrompt, callAnalysisUserMessage } from './prompts';
import type { CallAnalysis } from './types';

// ── Configuration ─────────────────────────────────────────────
const MODEL              = 'claude-sonnet-4-6';
const MAX_OUTPUT_TOKENS  = 2000;
const ANTHROPIC_VERSION  = '2023-06-01';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';

// Pricing per million tokens (claude-sonnet-4-6 as of 2026-05-06)
const INPUT_COST_PER_M   = 3.00;
const OUTPUT_COST_PER_M  = 15.00;

// ── Public API ────────────────────────────────────────────────

export interface AnalyzeCallParams {
  transcriptText: string;
  durationSec:    number;
  filename:       string;
}

export interface AnalyzeCallResult {
  analysis:     CallAnalysis;
  rawJson:      Record<string, unknown>;
  inputTokens:  number;
  outputTokens: number;
  costUsd:      number;
}

/** Shape of the Anthropic /v1/messages response we care about. */
interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
  usage:   { input_tokens: number; output_tokens: number };
}

/**
 * Send a call transcript to Claude, get back structured Hebrew analysis.
 * Throws if the API key is missing, the request fails, or the response
 * isn't valid JSON.
 */
export async function analyzeCall(params: AnalyzeCallParams): Promise<AnalyzeCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment');
  }

  const requestBody = {
    model:      MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system:     callAnalysisSystemPrompt(),
    messages: [
      {
        role:    'user',
        content: callAnalysisUserMessage(
          params.transcriptText,
          params.durationSec,
          params.filename,
        ),
      },
    ],
  };

  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(
      `Anthropic API returned ${response.status}: ${errBody.substring(0, 300)}`,
    );
  }

  const data = (await response.json()) as AnthropicMessageResponse;

  // Extract text content from the response
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new Error('Claude response contained no text block');
  }
  const rawText = textBlock.text.trim();

  // Strip markdown fences if Claude added them despite our instructions
  const cleanText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  // Parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanText);
  } catch (e) {
    throw new Error(
      'Claude response was not valid JSON: ' +
        (e instanceof Error ? e.message : String(e)) +
        ' | First 200 chars: ' +
        cleanText.substring(0, 200),
    );
  }

  // Coerce into CallAnalysis shape (with defaults for missing fields)
  const analysis: CallAnalysis = {
    summary_he:        getStr(parsed, 'summary_he'),
    customer_name_he:  getStr(parsed, 'customer_name_he'),
    customer_phone:    getStr(parsed, 'customer_phone'),
    customer_location: getStr(parsed, 'customer_location'),
    project_type:      getStr(parsed, 'project_type'),
    desired_style:     getStr(parsed, 'desired_style'),
    budget_signal:     getStr(parsed, 'budget_signal'),
    dimensions:        getStr(parsed, 'dimensions'),
    stone_preference:  getStr(parsed, 'stone_preference'),
    faucet_setup:      getStr(parsed, 'faucet_setup'),
    delivery_timeline: getStr(parsed, 'delivery_timeline'),
    action_items_he:   getStrArr(parsed, 'action_items_he'),
    open_questions_he: getStrArr(parsed, 'open_questions_he'),
    red_flags_he:      getStrArr(parsed, 'red_flags_he'),
    notes_he:          getStr(parsed, 'notes_he'),
  };

  // Cost calculation
  const inputTokens  = data.usage.input_tokens  || 0;
  const outputTokens = data.usage.output_tokens || 0;
  const costUsd =
    (inputTokens  / 1_000_000) * INPUT_COST_PER_M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_M;

  return {
    analysis,
    rawJson: parsed,
    inputTokens,
    outputTokens,
    costUsd,
  };
}

// ── Helpers ───────────────────────────────────────────────────

function getStr(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === 'string' ? v : '';
}

function getStrArr(obj: Record<string, unknown>, key: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}
