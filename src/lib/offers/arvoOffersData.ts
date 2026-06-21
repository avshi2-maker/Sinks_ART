'use server';

// src/lib/offers/arvoOffersData.ts
// Saved ARVO offers — server actions. Types/constants live in arvoOffersTypes.ts.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { ArvoOfferRow, OfferRecipient, OfferStatus } from '@/lib/offers/arvoOffersTypes';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface OfferResult { ok: boolean; error?: string; id?: string; }

export async function listArvoOffers(): Promise<ArvoOfferRow[]> {
  const sb = getServerSupabase();
  const res = await sb.from('arvo_offers').select('*').order('created_at', { ascending: false });
  if (res.error) { console.error('[listArvoOffers]', res.error.message); return []; }
  return (res.data || []) as ArvoOfferRow[];
}

export async function getArvoOffer(id: string): Promise<ArvoOfferRow | null> {
  if (!id) return null;
  const sb = getServerSupabase();
  const res = await sb.from('arvo_offers').select('*').eq('id', id).single();
  if (res.error || !res.data) { console.error('[getArvoOffer]', res.error?.message); return null; }
  return res.data as ArvoOfferRow;
}

export interface SaveArvoOfferInput {
  offer_no: string;
  job_id?: string | null;
  customer_name?: string;
  customer_phone?: string;
  recipient?: OfferRecipient;
  status?: OfferStatus;
  total_ils?: number;
  commission?: number;
  body_html?: string;
  notes?: string;
  sent_at?: string | null;
}

export async function saveArvoOffer(input: SaveArvoOfferInput): Promise<OfferResult> {
  if (!input.offer_no?.trim()) return { ok: false, error: 'missing offer_no' };
  const sb = getServerSupabase();
  const res = await sb.from('arvo_offers').insert({
    offer_no: input.offer_no.trim(),
    job_id: input.job_id || null,
    customer_name: input.customer_name || null,
    customer_phone: input.customer_phone || null,
    recipient: input.recipient || 'customer',
    status: input.status || 'sent',
    total_ils: input.total_ils || 0,
    commission: input.commission || 0,
    body_html: input.body_html || null,
    notes: input.notes || null,
    sent_at: input.sent_at || new Date().toISOString(),
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/offers-sent');
  revalidatePath('/dashboard');
  return { ok: true, id: res.data.id as string };
}

export interface UpdateArvoOfferInput {
  customer_name?: string | null;
  customer_phone?: string | null;
  recipient?: OfferRecipient;
  status?: OfferStatus;
  total_ils?: number;
  commission?: number;
  body_html?: string | null;
  notes?: string | null;
}

export async function updateArvoOffer(id: string, vals: UpdateArvoOfferInput): Promise<OfferResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('arvo_offers').update({ ...vals, updated_at: new Date().toISOString() }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/offers-sent');
  revalidatePath('/dashboard');
  return { ok: true, id };
}

export async function setOfferStatus(id: string, status: OfferStatus): Promise<OfferResult> {
  return updateArvoOffer(id, { status });
}

export async function deleteArvoOffer(id: string): Promise<OfferResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('arvo_offers').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/offers-sent');
  return { ok: true, id };
}
