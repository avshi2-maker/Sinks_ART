/**
 * src/lib/sinc/apiMeter.ts
 *
 * Cost tracking for SinC-ART. Knows the per-million-token (Anthropic)
 * and per-minute (ElevenLabs) prices, accumulates the cost across the
 * upload → transcribe → analyze pipeline.
 *
 * Pure logic — no React, no DOM. Used by:
 *   - The /sinc page UI to display a live cost meter (Phase D)
 *   - The save flow to record api_cost_usd in customer_communications (Phase E)
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 * Replaces: api_meter.js (v7)
 */

import type { ApiMeterReading, ApiMeterStage } from './types';

// ── Pricing constants ─────────────────────────────────────────
// Update these here when providers change pricing.

export const PRICING = {
  // Anthropic — per million tokens (claude-sonnet-4-6 as of 2026-05-06)
  anthropic: {
    inputPerM:  3.00,
    outputPerM: 15.00,
  },
  // ElevenLabs — Scribe v1 transcription, per minute of audio
  elevenLabs: {
    perMinute:  0.40,
  },
  // Cloudinary — free tier covers all uploads under 25 GB/month
  cloudinary: {
    perUpload:  0,
  },
} as const;

// ── Cost helpers ──────────────────────────────────────────────

export function calcAnthropicCost(inputTokens: number, outputTokens: number): number {
  const inT  = Math.max(0, inputTokens  | 0);
  const outT = Math.max(0, outputTokens | 0);
  return (
    (inT  / 1_000_000) * PRICING.anthropic.inputPerM +
    (outT / 1_000_000) * PRICING.anthropic.outputPerM
  );
}

export function calcElevenLabsCost(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return (durationSec / 60) * PRICING.elevenLabs.perMinute;
}

export function calcCloudinaryCost(): number {
  return PRICING.cloudinary.perUpload;
}

// ── Reading factories ─────────────────────────────────────────
// Used by React components to build ApiMeterReading objects without
// having to remember every field name.

export function makeIdleReading(): ApiMeterReading {
  return {
    stage:       'idle',
    moduleLabel: '',
    startedAt:   0,
  };
}

export function makeRunningReading(stage: ApiMeterStage, moduleLabel: string): ApiMeterReading {
  return {
    stage,
    moduleLabel,
    startedAt: Date.now(),
  };
}

export function makeDoneReading(
  prev:         ApiMeterReading,
  inputTokens:  number,
  outputTokens: number,
  costUsd:      number,
): ApiMeterReading {
  return {
    ...prev,
    stage:        'done',
    finishedAt:   Date.now(),
    inputTokens,
    outputTokens,
    costUsd,
  };
}

export function makeErrorReading(prev: ApiMeterReading, errorMsg: string): ApiMeterReading {
  return {
    ...prev,
    stage:      'error',
    finishedAt: Date.now(),
    errorMsg,
  };
}

// ── Accumulator (for the full pipeline) ───────────────────────

export interface PipelineCostBreakdown {
  cloudinaryUsd:  number;
  elevenLabsUsd:  number;
  anthropicUsd:   number;
  totalUsd:       number;
}

export function accumulatePipelineCost(parts: {
  durationSec?:  number;       // for ElevenLabs
  inputTokens?:  number;       // for Anthropic
  outputTokens?: number;
}): PipelineCostBreakdown {
  const cloudinaryUsd = calcCloudinaryCost();
  const elevenLabsUsd = parts.durationSec ? calcElevenLabsCost(parts.durationSec) : 0;
  const anthropicUsd  =
    parts.inputTokens || parts.outputTokens
      ? calcAnthropicCost(parts.inputTokens || 0, parts.outputTokens || 0)
      : 0;

  return {
    cloudinaryUsd,
    elevenLabsUsd,
    anthropicUsd,
    totalUsd: cloudinaryUsd + elevenLabsUsd + anthropicUsd,
  };
}

// ── Display helpers ───────────────────────────────────────────

export function formatUsd(usd: number): string {
  if (!Number.isFinite(usd)) return '$0.0000';
  return '$' + usd.toFixed(4);
}

export function formatElapsedSec(reading: ApiMeterReading): string {
  if (reading.stage === 'idle' || !reading.startedAt) return '0.0s';
  const end = reading.finishedAt || Date.now();
  const sec = (end - reading.startedAt) / 1000;
  return sec.toFixed(1) + 's';
}
