// src/app/api/sort-correspondence/route.ts
// Phase 29 — POST: takes a WhatsApp blob, returns messages tagged bucket + party.
// Mirrors /api/sinc-analyze. Server-side only; API key never leaves the server.

import { NextRequest, NextResponse } from 'next/server';
import { sortCorrespondence } from '@/lib/sorter/sortCorrespondence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CHARS = 100_000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'גוף הבקשה אינו JSON תקני' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  if (!text) {
    return NextResponse.json({ success: false, error: 'אין טקסט למיון' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ success: false, error: 'טקסט ארוך מדי (' + text.length + ' תווים, מקסימום ' + MAX_CHARS + ')' }, { status: 400 });
  }

  try {
    const result = await sortCorrespondence(text);
    return NextResponse.json({
      success: true,
      messages: result.messages,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      apiCostUsd: result.costUsd,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sort-correspondence] error:', msg);
    return NextResponse.json({ success: false, error: 'שגיאת מיון: ' + msg }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
