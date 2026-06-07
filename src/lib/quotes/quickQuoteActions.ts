'use server';

// src/lib/quotes/quickQuoteActions.ts
// Phase 27 — Quick Quote (הצעה מהירה): a low-tech ballpark price saved to the
// customer file. Writes a quotes + quote_lines pair (status draft, source
// manual) + a note on the customer timeline. Promotable to a full quote later.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { nextQuoteNumber } from './fetchQuotes';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface QuickQuoteInput {
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  projectId?: string | null;
  supplierCost: number;
  supplierLabel?: string;
  customerPrice: number;
  includedText: string;
  markupNote?: string;
  messageText: string;
}

export interface QuickQuoteResult {
  ok: boolean;
  error?: string;
  quoteId?: string;
  quoteNumber?: string;
}

export async function createQuickQuote(input: QuickQuoteInput): Promise<QuickQuoteResult> {
  const price = Number(input.customerPrice) || 0;
  const cost = Number(input.supplierCost) || 0;
  if (price <= 0) return { ok: false, error: 'יש להזין מחיר ללקוח' };

  const sb = getServerSupabase();
  const nowIso = new Date().toISOString();
  const margin = Math.round((price - cost) * 100) / 100;
  const included = (input.includedText || '').trim();

  let quoteNumber: string;
  try {
    quoteNumber = await nextQuoteNumber();
  } catch {
    quoteNumber = 'MARB-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-3);
  }

  const headRes = await sb.from('quotes').insert({
    quote_number:      quoteNumber,
    customer_id:       input.customerId,
    project_id:        input.projectId ?? null,
    customer_name_he:  input.customerName,
    customer_phone:    input.customerPhone,
    status:            'draft',
    source:            'manual',
    vat_rate:          0.18,
    currency_code:     'ILS',
    total_subtotal:    price,
    total_vat:         0,
    total_grand:       price,
    total_cost:        cost,
    total_margin:      margin,
    notes_he:          included || null,
    internal_notes_he: input.markupNote || null,
    created_at:        nowIso,
    updated_at:        nowIso,
  }).select('id').maybeSingle();

  if (headRes.error) return { ok: false, error: headRes.error.message };
  const quoteId = headRes.data?.id as string;

  const lineRes = await sb.from('quote_lines').insert({
    quote_id:         quoteId,
    line_number:      1,
    description_he:   included || 'כיור שיש בעבודת יד, מותקן',
    unit:             'פאושלי',
    quantity:         1,
    unit_cost:        price,
    vat_applies:      false,
    supplier_cost:    cost,
    supplier_label:   input.supplierLabel || 'Ales',
    sink_id:          null,
    marble_sample_id: null,
    created_at:       nowIso,
  });
  if (lineRes.error) return { ok: false, error: lineRes.error.message };

  const internalLine = '\n\n———\n(פנימי) עלות ' + (input.supplierLabel || 'אלס') +
    ': ₪' + cost.toLocaleString('he-IL') + ' · מרווח גס: ₪' + margin.toLocaleString('he-IL') +
    (input.markupNote ? ' · ' + input.markupNote : '');

  await sb.from('customer_communications').insert({
    customer_id: input.customerId,
    project_id:  input.projectId ?? null,
    comm_type:   'note',
    subject:     'הצעת מחיר מהירה — ' + quoteNumber,
    body:        input.messageText + internalLine,
    occurred_at: nowIso,
  });

  revalidatePath('/customers/' + input.customerId);
  return { ok: true, quoteId, quoteNumber };
}
