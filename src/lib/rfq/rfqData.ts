'use server';

// src/lib/rfq/rfqData.ts
// Ales RFQ pipeline: create (Avshi), fetch by token (Ales page), submit response (Ales)
// -> saves response + creates a /suppliers offer to review. Email alert = chunk 3b.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createSupplierOffer } from '@/lib/suppliers/suppliersData';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface RfqAsset {
  url: string;
  kind: 'image' | 'video' | 'audio' | 'sketch' | 'file';
  label?: string;
}

export interface RfqSpec {
  modelName?: string;
  dimensions?: string;
  basinCount?: number;
  mount?: string;
  stone?: string;
  pitch?: string;
  notes?: string;
}

export interface RfqRow {
  id: string;
  token: string;
  title_he: string;
  project_ref: string | null;
  customer_hint: string | null;
  questions: { spec?: RfqSpec } | null;
  asset_urls: RfqAsset[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRfqInput {
  title_he: string;
  project_ref?: string | null;
  customer_hint?: string | null;
  spec?: RfqSpec;
  assets?: RfqAsset[];
}

export interface CreateRfqResult { ok: boolean; error?: string; token?: string; id?: string; }

function makeToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 22; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

export async function createRfq(input: CreateRfqInput): Promise<CreateRfqResult> {
  if (!input.title_he?.trim()) return { ok: false, error: 'חסרה כותרת ל-RFQ' };
  const sb = getServerSupabase();
  const token = makeToken();
  const res = await sb.from('rfqs').insert({
    token,
    title_he: input.title_he.trim(),
    project_ref: input.project_ref?.trim() || null,
    customer_hint: input.customer_hint?.trim() || null,
    questions: input.spec ? { spec: input.spec } : {},
    asset_urls: input.assets || [],
    status: 'open',
  }).select('id, token').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/rfq-create');
  return { ok: true, token: res.data.token as string, id: res.data.id as string };
}

export async function fetchRfqByToken(token: string): Promise<RfqRow | null> {
  if (!token) return null;
  const sb = getServerSupabase();
  const res = await sb.from('rfqs').select('*').eq('token', token).single();
  if (res.error || !res.data) { console.error('[fetchRfqByToken]', res.error?.message); return null; }
  return res.data as RfqRow;
}

export async function listRecentRfqs(limit = 20): Promise<RfqRow[]> {
  const sb = getServerSupabase();
  const res = await sb.from('rfqs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (res.error) { console.error('[listRecentRfqs]', res.error.message); return []; }
  return (res.data || []) as RfqRow[];
}

// ---- Ales side: submit a priced response ----

export interface RfqLineItem { desc: string; price: number; }

export interface SubmitRfqInput {
  token: string;
  lineItems: RfqLineItem[];
  totalIls: number;
  remarkHe?: string;
  sitePhotoUrls?: string[];
}

export interface SubmitRfqResult { ok: boolean; error?: string; }

export async function submitRfqResponse(input: SubmitRfqInput): Promise<SubmitRfqResult> {
  if (!input.token) return { ok: false, error: 'missing token' };
  if (!input.totalIls || input.totalIls <= 0) return { ok: false, error: 'missing price' };
  const sb = getServerSupabase();

  // resolve rfq by token (need title/project for the supplier offer)
  const rfqRes = await sb.from('rfqs').select('id, title_he, project_ref, customer_hint').eq('token', input.token).single();
  if (rfqRes.error || !rfqRes.data) return { ok: false, error: 'RFQ not found' };
  const rfqId = rfqRes.data.id as string;
  const title = (rfqRes.data.title_he as string) || 'RFQ';
  const projectRef = (rfqRes.data.project_ref as string) || title;

  // insert the response
  const insRes = await sb.from('rfq_responses').insert({
    rfq_id: rfqId,
    line_items: input.lineItems,
    total_ils: input.totalIls,
    remark_he: input.remarkHe?.trim() || null,
    ales_photo_urls: input.sitePhotoUrls && input.sitePhotoUrls.length > 0 ? input.sitePhotoUrls : null,
  }).select('id').single();
  if (insRes.error || !insRes.data) return { ok: false, error: insRes.error?.message || 'no response row' };
  const responseId = insRes.data.id as string;

  // create a /suppliers offer from Ales's pricing (flows into the review + commission screen)
  let offerId: string | null = null;
  try {
    const offer = await createSupplierOffer({
      supplier_name: 'אלס - ARVO',
      trade: 'ייצור כיורי שיש',
      project_ref: projectRef,
      source: 'ales_rfq',
      raw_message: input.remarkHe?.trim() || null,
      line_items: input.lineItems,
      total_ils: input.totalIls,
      save_to_directory: true,
    });
    if (offer.ok) offerId = offer.id || null;
    else console.error('[submitRfqResponse] createSupplierOffer failed:', offer.error);
  } catch (e) {
    console.error('[submitRfqResponse] offer creation threw (non-blocking):', e);
  }

  // link the offer back onto the response (best-effort)
  if (offerId) {
    await sb.from('rfq_responses').update({ supplier_offer_id: offerId }).eq('id', responseId);
  }

  // mark the RFQ answered
  const updRes = await sb.from('rfqs').update({ status: 'answered', updated_at: new Date().toISOString() }).eq('id', rfqId);
  if (updRes.error) return { ok: false, error: updRes.error.message };

  return { ok: true };
}
