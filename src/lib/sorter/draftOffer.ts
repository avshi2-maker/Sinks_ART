'use server';

// src/lib/sorter/draftOffer.ts
// Phase 30 — pull saved price/options messages for a project + save a draft quote.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { nextQuoteNumber } from '@/lib/quotes/fetchQuotes';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Pull saved bucket_price + bucket_options message bodies for a customer/project.
export async function fetchPriceMessages(customerId: string, projectId?: string | null): Promise<string> {
  const sb = getServerSupabase();
  let q = sb.from('customer_communications')
    .select('body, comm_type, occurred_at')
    .eq('customer_id', customerId)
    .in('comm_type', ['bucket_price', 'bucket_options'])
    .order('occurred_at', { ascending: true });
  if (projectId) q = q.eq('project_id', projectId);
  const res = await q;
  if (res.error) return '';
  const rows = (res.data || []) as { body: string | null }[];
  return rows.map((r) => r.body || '').filter(Boolean).join('\n');
}

export interface DraftLine { item: string; price: number; remark: string; }

export interface SaveDraftInput {
  customerId: string;
  customerName: string | null;
  projectId?: string | null;
  lines: DraftLine[];
  vatRate?: number;
}

export interface SaveDraftResult { ok: boolean; error?: string; quoteId?: string; quoteNumber?: string; }

export async function saveDraftOffer(input: SaveDraftInput): Promise<SaveDraftResult> {
  const lines = (input.lines || []).filter((l) => l.item && l.item.trim());
  if (!input.customerId) return { ok: false, error: 'missing customer' };
  if (lines.length === 0) return { ok: false, error: 'אין פריטים בהצעה' };

  const sb = getServerSupabase();
  const now = new Date().toISOString();
  const subtotal = lines.reduce((s, l) => s + (Number(l.price) || 0), 0);

  let quoteNumber: string;
  try { quoteNumber = await nextQuoteNumber(); }
  catch { quoteNumber = 'MARB-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-3); }

  const headRes = await sb.from('quotes').insert({
    quote_number: quoteNumber,
    customer_id: input.customerId,
    project_id: input.projectId ?? null,
    customer_name_he: input.customerName,
    status: 'draft',
    source: 'manual',
    vat_rate: 0.18,
    currency_code: 'ILS',
    total_subtotal: subtotal,
    total_vat: 0,
    total_grand: subtotal,
    notes_he: 'טיוטה מתוך תכתובת',
    created_at: now,
    updated_at: now,
  }).select('id').maybeSingle();

  if (headRes.error) return { ok: false, error: headRes.error.message };
  const quoteId = headRes.data?.id as string;

  const lineRows = lines.map((l, i) => ({
    quote_id: quoteId,
    line_number: i + 1,
    description_he: l.item.trim() + (l.remark && l.remark.trim() ? ' (' + l.remark.trim() + ')' : ''),
    unit: "יח'",
    quantity: 1,
    unit_cost: Number(l.price) || 0,
    vat_applies: false,
    created_at: now,
  }));

  const linesRes = await sb.from('quote_lines').insert(lineRows);
  if (linesRes.error) return { ok: false, error: linesRes.error.message };

  if (input.projectId) revalidatePath('/customers/' + input.customerId);
  return { ok: true, quoteId, quoteNumber };
}
