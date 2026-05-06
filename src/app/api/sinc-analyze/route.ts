/**
 * src/app/api/sinc-analyze/route.ts
 *
 * Next.js App Router API endpoint at POST /api/sinc-analyze.
 * Receives a Hebrew call transcript from the browser, calls Claude
 * server-side, returns structured analysis + cost.
 *
 * SECURITY:
 *   - Runs on the Vercel server (Node runtime), not in the browser.
 *   - The Anthropic API key never leaves the server.
 *   - Same security model as /api/analyze-photo (Phase 15).
 *
 * Request body shape:  SincAnalyzeRequest  (from src/lib/sinc/types.ts)
 * Response body shape: SincAnalyzeResponse
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeCall } from '@/lib/sinc/claudeAnalysis';
import type { SincAnalyzeRequest, SincAnalyzeResponse } from '@/lib/sinc/types';

// Force Node runtime (the Edge runtime can't use process.env at request time the same way)
export const runtime = 'nodejs';

// Tell Next.js this route is dynamic (no caching)
export const dynamic = 'force-dynamic';

const MAX_TRANSCRIPT_CHARS = 100_000;   // ~25k tokens worth of Hebrew

export async function POST(req: NextRequest): Promise<NextResponse<SincAnalyzeResponse>> {
  // ── Parse + validate body ───────────────────────────────────
  let body: SincAnalyzeRequest;
  try {
    body = (await req.json()) as SincAnalyzeRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: 'גוף הבקשה אינו JSON תקני' },
      { status: 400 },
    );
  }

  if (!body.transcriptText || typeof body.transcriptText !== 'string') {
    return NextResponse.json(
      { success: false, error: 'transcriptText חסר או אינו טקסט' },
      { status: 400 },
    );
  }

  const trimmed = body.transcriptText.trim();
  if (trimmed.length === 0) {
    return NextResponse.json(
      { success: false, error: 'תמלול ריק' },
      { status: 400 },
    );
  }

  if (trimmed.length > MAX_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      {
        success: false,
        error:
          `תמלול ארוך מדי (${trimmed.length} תווים, מקסימום ${MAX_TRANSCRIPT_CHARS}). ` +
          `שיחות ארוכות יש לפצל לחלקים.`,
      },
      { status: 400 },
    );
  }

  const durationSec = Number.isFinite(body.durationSec) && body.durationSec > 0
    ? Math.floor(body.durationSec)
    : 0;
  const filename = typeof body.filename === 'string' && body.filename
    ? body.filename
    : 'call.unknown';

  // ── Call Claude ─────────────────────────────────────────────
  try {
    const result = await analyzeCall({
      transcriptText: trimmed,
      durationSec,
      filename,
    });

    return NextResponse.json({
      success:      true,
      analysis:     result.analysis,
      rawJson:      result.rawJson,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      apiCostUsd:   result.costUsd,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sinc-analyze] Claude error:', msg);

    return NextResponse.json(
      { success: false, error: 'שגיאת ניתוח: ' + msg },
      { status: 500 },
    );
  }
}

// Block other HTTP methods cleanly
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with a SincAnalyzeRequest body.' },
    { status: 405 },
  );
}
