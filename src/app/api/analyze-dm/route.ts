// src/app/api/analyze-dm/route.ts
// Phase 42 — Instagram DM -> structured lead fields via Claude.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM = `You extract lead details from an Instagram DM conversation for a custom marble sink business (Hebrew market). Return ONLY a JSON object, no markdown, no preamble. Fields:
- full_name: the customer's name if mentioned, else null
- phone: phone number if present (keep digits/dashes), else null
- city_he: city in Hebrew if mentioned, else null
- project_type_raw: free text of what they want (Hebrew), else null
- budget_raw: any budget/price hint as free text, else null
- style_he: desired style in Hebrew if mentioned, else null
- summary_he: one short Hebrew sentence summarizing the inquiry
Respond with valid JSON only.`;

export async function POST(req: Request) {
  try {
    const { dmText } = await req.json();
    if (!dmText || !String(dmText).trim()) {
      return NextResponse.json({ success: false, error: 'אין טקסט לניתוח' }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM,
        messages: [{ role: 'user', content: String(dmText).slice(0, 8000) }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ success: false, error: data?.error?.message || 'Claude error' }, { status: 500 });

    const text = (data.content || []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();
    let parsed: Record<string, string | null> = {};
    try { parsed = JSON.parse(clean); } catch { parsed = {}; }

    const inTok = Number(data.usage?.input_tokens || 0);
    const outTok = Number(data.usage?.output_tokens || 0);
    const cost = (inTok / 1e6) * 3 + (outTok / 1e6) * 15;

    return NextResponse.json({ success: true, parsed, apiCostUsd: cost });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
