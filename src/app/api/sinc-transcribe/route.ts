/**
 * src/app/api/sinc-transcribe/route.ts
 *
 * Next.js App Router API endpoint at POST /api/sinc-transcribe.
 * Receives a Cloudinary audio URL from the browser, calls ElevenLabs
 * server-side, returns transcript + speaker bubbles + cost.
 *
 * SECURITY: Runs in Node runtime on Vercel. ELEVENLABS_API_KEY never
 * leaves the server. Same security model as /api/sinc-analyze.
 *
 * Request body: { audioUrl: string, durationSec: number }
 * Response: { success, transcription, costUsd, error? }
 *
 * Phase B/C — Audio pipeline (Session 17, 06/05/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/sinc/elevenlabs';
import { calcElevenLabsCost } from '@/lib/sinc/apiMeter';
import type { TranscriptionResult } from '@/lib/sinc/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ElevenLabs Scribe can take 30-60 sec for longer audio
export const maxDuration = 90;

interface TranscribeRequest {
  audioUrl:    string;
  durationSec: number;
}

interface TranscribeResponse {
  success:        boolean;
  transcription?: TranscriptionResult;
  costUsd?:       number;
  error?:         string;
}

export async function POST(req: NextRequest): Promise<NextResponse<TranscribeResponse>> {
  // ── Parse + validate body ───────────────────────────────────
  let body: TranscribeRequest;
  try {
    body = (await req.json()) as TranscribeRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: 'גוף הבקשה אינו JSON תקני' },
      { status: 400 },
    );
  }

  if (!body.audioUrl || typeof body.audioUrl !== 'string') {
    return NextResponse.json(
      { success: false, error: 'audioUrl חסר או אינו טקסט' },
      { status: 400 },
    );
  }

  // Sanity check: must be HTTPS Cloudinary URL (don't let randoms transcribe arbitrary URLs)
  if (!body.audioUrl.startsWith('https://res.cloudinary.com/')) {
    return NextResponse.json(
      { success: false, error: 'audioUrl חייב להיות מ-Cloudinary' },
      { status: 400 },
    );
  }

  const durationSec = Number.isFinite(body.durationSec) && body.durationSec > 0
    ? Math.floor(body.durationSec)
    : 0;

  // ── Call ElevenLabs ─────────────────────────────────────────
  try {
    const transcription = await transcribeAudio({
      audioUrl:    body.audioUrl,
      durationSec,
    });

    const costUsd = calcElevenLabsCost(transcription.durationSec);

    return NextResponse.json({
      success: true,
      transcription,
      costUsd,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sinc-transcribe] ElevenLabs error:', msg);

    return NextResponse.json(
      { success: false, error: 'שגיאת תמלול: ' + msg },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with { audioUrl, durationSec }.' },
    { status: 405 },
  );
}
