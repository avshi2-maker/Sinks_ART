// src/app/api/analyze-supplier/route.ts
// Supplier price-offer extraction -> structured line-items via Claude.
// Sibling of analyze-dm (which handles CUSTOMER leads). This one handles SUPPLIER offers (e.g. Ales).

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM = `You extract a SUPPLIER's price offer from a pasted message (WhatsApp / call notes), for a custom marble sink business in Israel (Hebrew market). The supplier (e.g. a fabricator named Ales) quotes prices for a project. All prices are FINAL, VAT-included shekel amounts (₪ / ש"ח). Return ONLY a JSON object, no markdown, no preamble. Fields:
- supplier_name: the supplier's name if mentioned, else null
- supplier_phone: phone number if present (keep digits/dashes), else null
- project_ref: short Hebrew label of what the offer is for (e.g. "כיור שיש מותאם"), else null
- line_items: an array of { "desc": <Hebrew description>, "price": <number in ILS, no symbols/commas> }. Break the offer into its parts (e.g. כיור, סיפון, התקנה, הובלה, פלטה). If the message gives one bundled price, return a single line with that total. If a part is explicitly "כלול"/included with no separate charge, set its price to 0. Never invent prices.
- total_ils: the grand total in ILS as a number if stated; if not stated, sum the line_items; if nothing numeric, 0
- notes_he: one short Hebrew sentence summarizing the offer
Respond with valid JSON only.`;

export async function POST(req: Request) {
  try {
    const { offerText } = await req.json();
    if (!offerText || !String(offerText).trim()) {
      return NextResponse.json({ success: false, error: 'אין טקסט לניתוח' }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: 'user', content: String(offerText).slice(0, 8000) }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ success: false, error: data?.error?.message || 'Claude error' }, { status: 500 });

    const text = (data.content || []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(clean); } catch { parsed = {}; }

    // normalize line_items + total defensively
    const rawItems = Array.isArray(parsed.line_items) ? parsed.line_items : [];
    const line_items = rawItems.map((it: unknown) => {
      const obj = (it && typeof it === 'object') ? it as Record<string, unknown> : {};
      const desc = typeof obj.desc === 'string' ? obj.desc : '';
      const price = Number(obj.price) || 0;
      return { desc, price };
    }).filter((it) => it.desc || it.price);

    let total = Number(parsed.total_ils) || 0;
    if (!total && line_items.length) total = line_items.reduce((s, it) => s + (Number(it.price) || 0), 0);

    const inTok = Number(data.usage?.input_tokens || 0);
    const outTok = Number(data.usage?.output_tokens || 0);
    const cost = (inTok / 1e6) * 3 + (outTok / 1e6) * 15;

    return NextResponse.json({
      success: true,
      parsed: {
        supplier_name: (parsed.supplier_name as string) || '',
        supplier_phone: (parsed.supplier_phone as string) || '',
        project_ref: (parsed.project_ref as string) || '',
        notes_he: (parsed.notes_he as string) || '',
        line_items,
        total_ils: total,
      },
      apiCostUsd: cost,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
