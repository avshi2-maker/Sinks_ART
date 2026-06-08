// src/app/api/extract-items/route.ts
// Phase 30 — POST: takes price-related text, returns {item, price, remark} rows.

import { NextRequest, NextResponse } from 'next/server';
import { extractItems } from '@/lib/sorter/extractItems';

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
    return NextResponse.json({ success: false, error: 'אין טקסט לחילוץ' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ success: false, error: 'טקסט ארוך מדי' }, { status: 400 });
  }

  try {
    const result = await extractItems(text);
    return NextResponse.json({
      success: true,
      items: result.items,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      apiCostUsd: result.costUsd,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[extract-items] error:', msg);
    return NextResponse.json({ success: false, error: 'שגיאת חילוץ: ' + msg }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
