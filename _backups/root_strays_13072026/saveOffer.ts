'use server';

// src/lib/offers/saveOffer.ts
// Saves a built offer into the quotes table. total_margin = commission (flows to ROI).
// total_cost = base + components (Ales labor + materials); total_grand = full price to customer.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { SaveOfferInput, SaveOfferResult } from './offerTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function saveOffer(input: SaveOfferInput): Promise<SaveOfferResult> {
  const cost = Math.round(Number(input.cost) || 0);          // base + components
  const commission = Math.round(Number(input.commission) || 0);
  const grand = cost + commission;                            // full price to customer
  if (grand <= 0) return { ok: false, error: 'הצעה ריקה — אין מה לשמור' };

  const nowIso = new Date().toISOString();
  const quoteNumber = 'MARB-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-4);
  const db = sb();

  const headRes = await db.from('quotes').insert({
    quote_number:      quoteNumber,
    customer_id:       input.customerId ?? null,
    project_id:        input.projectId ?? null,
    customer_name_he:  input.customerName ?? null,
    status:            'draft',
    source:            'offer-builder',
    vat_rate:          0.18,
    currency_code:     'ILS',
    total_subtotal:    grand,
    total_vat:         0,
    total_grand:       grand,
    total_cost:        cost,
    total_margin:      commission,
    notes_he:          input.summaryText || null,
    internal_notes_he: 'עמלה: ₪' + commission.toLocaleString('he-IL'),
    created_at:        nowIso,
    updated_at:        nowIso,
  }).select('id').maybeSingle();
  if (headRes.error) return { ok: false, error: headRes.error.message };
  const quoteId = headRes.data?.id as string;

  // One summary line (the builder's own line items live in the summary text).
  await db.from('quote_lines').insert({
    quote_id:       quoteId,
    line_number:    1,
    description_he: input.title || 'הצעת מחיר',
    unit:           'פאושלי',
    quantity:       1,
    unit_cost:      grand,
    vat_applies:    false,
    supplier_cost:  cost,
    supplier_label: 'Ales',
    created_at:     nowIso,
  });

  if (input.customerId) revalidatePath('/customers/' + input.customerId);
  revalidatePath('/quotes');
  revalidatePath('/roi');
  return { ok: true, quoteId, quoteNumber };
}
