// src/app/api/case-transcribe/route.ts · updated 23.09.2026 10:34 (Asia/Jerusalem)
// POST { id } → the job's customer recording (Cloudinary) → existing ElevenLabs Scribe pipeline → case_studies.transcript.

import { NextRequest, NextResponse } from 'next/server';
import { fetchCase, crmDb } from '@/lib/case/caseData';
import { transcribeAudio } from '@/lib/sinc/elevenlabs';
import { calcElevenLabsCost } from '@/lib/sinc/apiMeter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });
    const c = await fetchCase(id);
    if (!c) return NextResponse.json({ ok: false, error: 'לא נמצא' }, { status: 404 });
    if (!c.voice?.url) return NextResponse.json({ ok: false, error: 'אין הקלטה לעבודה הזו' }, { status: 400 });
    const durationSec = Number(c.voice.durationSec || 60);
    const t = await transcribeAudio({ audioUrl: c.voice.url, durationSec });
    const text = t.bubbles && t.bubbles.length
      ? t.bubbles.map((b) => (b.speaker_label || b.speaker_id || '') + ': ' + b.text).join('\n')
      : t.rawText;
    const cost = calcElevenLabsCost(t.durationSec || durationSec);
    const upd = await crmDb().from('case_studies').update({ transcript: text, transcript_cost: cost, updated_at: new Date().toISOString() }).eq('id', id);
    if (upd.error) return NextResponse.json({ ok: false, error: upd.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, transcript: text, costUsd: cost, durationSec: t.durationSec || durationSec });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
