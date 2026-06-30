'use server';

// src/lib/offers/priceBreaksData.ts
// Read + edit Ales turnkey price-breaks. Types live in offerTypes.ts (plain module).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { PriceBreakRow, PriceBreakResult } from './offerTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function fetchPriceBreaks(): Promise<PriceBreakRow[]> {
  const res = await sb()
    .from('ales_price_breaks')
    .select('id, label_he, price_ils, kind, sort_order')
    .is('archived_at', null)
    .order('sort_order', { ascending: true });
  if (res.error) { console.error('[fetchPriceBreaks]', res.error.message); return []; }
  return (res.data || []) as PriceBreakRow[];
}

export async function addPriceBreak(label: string, price: number, kind: string): Promise<PriceBreakResult> {
  const l = (label || '').trim();
  if (!l) return { ok: false, error: 'חובה שם תצורה' };
  const res = await sb().from('ales_price_breaks').insert({
    label_he: l, price_ils: Number(price) || 0, kind: kind === 'addon' ? 'addon' : 'base', sort_order: 99,
  }).select('id').single();
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/price-breaks');
  return { ok: true, id: res.data.id as string };
}

export async function updatePriceBreak(id: string, label: string, price: number, kind: string): Promise<PriceBreakResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const res = await sb().from('ales_price_breaks').update({
    label_he: (label || '').trim(), price_ils: Number(price) || 0, kind: kind === 'addon' ? 'addon' : 'base',
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/price-breaks');
  return { ok: true };
}

export async function archivePriceBreak(id: string): Promise<PriceBreakResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const res = await sb().from('ales_price_breaks').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/price-breaks');
  return { ok: true };
}
