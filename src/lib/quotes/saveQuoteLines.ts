'use server';

// src/lib/quotes/saveQuoteLines.ts
// Phase 32 — full quote editor save engine.
// Replaces a quote's lines and recomputes totals (per-line VAT).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface EditLine {
  description_he: string;
  unit: string;
  quantity: number;
  unit_cost: number;       // customer price per unit (existing column convention)
  vat_applies: boolean;
  supplier_cost?: number;  // internal cost per unit (optional)
}

export interface SaveQuoteLinesInput {
  quoteId: string;
  customerId?: string | null;
  vatRate?: number;        // fraction, e.g. 0.18
  lines: EditLine[];
}

export interface SaveQuoteLinesResult {
  ok: boolean;
  error?: string;
  totalGrand?: number;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

export async function saveQuoteLines(input: SaveQuoteLinesInput): Promise<SaveQuoteLinesResult> {
  if (!input.quoteId) return { ok: false, error: 'missing quote id' };
  const clean = (input.lines || []).filter((l) => (l.description_he || '').trim());
  const vatRate = typeof input.vatRate === 'number' ? input.vatRate : 0.18;
  const sb = getServerSupabase();
  const now = new Date().toISOString();

  // Totals (per-line VAT)
  let subtotal = 0, vatable = 0, cost = 0;
  for (const l of clean) {
    const lineTotal = (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0);
    subtotal += lineTotal;
    if (l.vat_applies) vatable += lineTotal;
    cost += (Number(l.quantity) || 0) * (Number(l.supplier_cost) || 0);
  }
  const vatAmount = round2(vatable * vatRate);
  subtotal = round2(subtotal);
  const grand = round2(subtotal + vatAmount);
  cost = round2(cost);
  const margin = round2(subtotal - cost);

  // 1) delete existing lines
  const delRes = await sb.from('quote_lines').delete().eq('quote_id', input.quoteId);
  if (delRes.error) return { ok: false, error: 'מחיקת שורות נכשלה: ' + delRes.error.message };

  // 2) insert new lines (skip insert if empty)
  if (clean.length > 0) {
    const rows = clean.map((l, i) => ({
      quote_id: input.quoteId,
      line_number: i + 1,
      description_he: l.description_he.trim(),
      unit: l.unit || "יח'",
      quantity: Number(l.quantity) || 0,
      unit_cost: Number(l.unit_cost) || 0,
      vat_applies: !!l.vat_applies,
      supplier_cost: Number(l.supplier_cost) || 0,
      created_at: now,
    }));
    const insRes = await sb.from('quote_lines').insert(rows);
    if (insRes.error) return { ok: false, error: 'הוספת שורות נכשלה: ' + insRes.error.message };
  }

  // 3) recompute quote totals
  const updRes = await sb.from('quotes').update({
    vat_rate: vatRate,
    total_subtotal: subtotal,
    total_vat: vatAmount,
    total_grand: grand,
    total_cost: cost,
    total_margin: margin,
    updated_at: now,
  }).eq('id', input.quoteId);
  if (updRes.error) return { ok: false, error: 'עדכון סכומים נכשל: ' + updRes.error.message };

  // 4) stamp the linked project's quoted_price_ils with this quote's grand total (for ROI pipeline ₪)
  const qRes = await sb.from('quotes').select('project_id').eq('id', input.quoteId).maybeSingle();
  const projectId = qRes.data?.project_id as string | undefined;
  if (projectId) {
    await sb.from('projects').update({ quoted_price_ils: grand, updated_at: now }).eq('id', projectId);
  }

  revalidatePath('/quotes/' + input.quoteId);
  if (input.customerId) revalidatePath('/customers/' + input.customerId);
  return { ok: true, totalGrand: grand };
}
