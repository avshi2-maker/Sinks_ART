// src/app/api/case-generate/route.ts · updated 23.09.2026 10:34 (Asia/Jerusalem)
// POST { id } → Claude writes the case file from Ales facts → saved to case_studies.gen (+ tokens/cost).

import { NextRequest, NextResponse } from 'next/server';
import { fetchCase, crmDb } from '@/lib/case/caseData';
import { caseSystemPrompt, caseUserMessage } from '@/lib/case/prompt';
import { calcAnthropicCost } from '@/lib/sinc/apiMeter';
import type { CaseGen } from '@/lib/case/caseTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const MODEL = 'claude-sonnet-4-6';

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });
    const c = await fetchCase(id);
    if (!c) return NextResponse.json({ ok: false, error: 'לא נמצא' }, { status: 404 });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: 'ANTHROPIC_API_KEY חסר' }, { status: 500 });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, system: caseSystemPrompt(), messages: [{ role: 'user', content: caseUserMessage(c) }] }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return NextResponse.json({ ok: false, error: 'Anthropic ' + res.status + ': ' + t.slice(0, 200) }, { status: 502 });
    }
    const data = (await res.json()) as { content: { type: string; text?: string }[]; usage: { input_tokens: number; output_tokens: number } };
    const raw = (data.content.find((b) => b.type === 'text')?.text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
    let gen: CaseGen;
    try { gen = JSON.parse(raw) as CaseGen; } catch { return NextResponse.json({ ok: false, error: 'Claude החזיר JSON לא תקין' }, { status: 502 }); }
    // A published page keeps its URL forever; only unpublished cases get a fresh slug.
    if (c.status === 'published' && c.slug) gen.slug = c.slug;
    else gen.slug = (gen.slug || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

    const inT = data.usage?.input_tokens || 0;
    const outT = data.usage?.output_tokens || 0;
    const cost = calcAnthropicCost(inT, outT);
    const prevCost = Number(c.gen_cost || 0);
    const upd = await crmDb().from('case_studies').update({
      gen, slug: c.status === 'published' ? c.slug : null,
      status: c.status === 'published' ? 'published' : 'generated',
      gen_tokens_in: inT, gen_tokens_out: outT, gen_cost: prevCost + cost,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (upd.error) return NextResponse.json({ ok: false, error: upd.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, gen, inputTokens: inT, outputTokens: outT, costUsd: cost, totalCostUsd: prevCost + cost });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
