'use server';

// src/lib/rfq/rfqData.ts
// Ales RFQ pipeline: create (Avshi), fetch by token (Ales page), submit response (Ales)
// -> saves response + creates a /suppliers offer + emails Avshi an alert.
//
// v5: MULTI-SINK. An RFQ can hold several sinks (questions.sinks[]). Ales prices
// each sink with A) full price (mandatory), B) installation (included or +price),
// C) misc/remark (optional price + text). Old single-spec RFQs still render via
// the spec fallback.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createSupplierOffer } from '@/lib/suppliers/suppliersData';
import { createJob } from '@/lib/pipeline/jobPipelineData';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Non-blocking alert email when Ales prices a job. Mirrors the lead-alert pattern.
async function sendAlesAlertEmail(opts: {
  title: string;
  total: number;
  lineItems: { desc: string; price: number }[];
  remark?: string;
}): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.LEAD_ALERT_EMAIL;
    if (!apiKey || !to) { console.warn('[alesAlert] missing RESEND_API_KEY/LEAD_ALERT_EMAIL — skip'); return; }
    const resend = new Resend(apiKey);
    const breakdown = opts.lineItems.map((li) => `  ${li.desc}: ₪${li.price.toLocaleString()}`).join('\n');
    const text = [
      `אלס תמחר עבודה: ${opts.title}`,
      ``,
      `סה"כ (עלות אלס, כולל מע"מ): ₪${opts.total.toLocaleString()}`,
      ``,
      `פירוט:`,
      breakdown,
      opts.remark ? `\nהערה: ${opts.remark}` : '',
      `\nפתח את /suppliers להוספת עמלה ובניית הצעת לקוח.`,
    ].filter((l) => l !== '').join('\n');
    await resend.emails.send({
      from: 'Marble Art RFQ <onboarding@resend.dev>',
      to: [to],
      subject: `🏭 אלס תמחר: ${opts.title} — ₪${opts.total.toLocaleString()}`,
      text,
    });
    console.log('[alesAlert] alert email sent');
  } catch (e) {
    console.error('[alesAlert] email failed (non-blocking):', e);
  }
}

export interface RfqAsset {
  url: string;
  kind: 'image' | 'video' | 'audio' | 'sketch' | 'file';
  label?: string;
}

// One sink in a multi-sink RFQ.
export interface RfqSink {
  id: string;
  name: string;        // e.g. "אמבט הורים 240 ס"מ"
  dimensions?: string; // e.g. "240×50×25"
  stone?: string;      // e.g. "קלקטה איטלקי"
  notes?: string;      // free text per sink
}

// Legacy single-sink spec (kept for old RFQs created before multi-sink).
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
  questions: { spec?: RfqSpec; sinks?: RfqSink[] } | null;
  asset_urls: RfqAsset[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Normalise any RFQ (old or new) to a list of sinks for the Ales UI.
export async function sinksFromRfq(rfq: RfqRow): Promise<RfqSink[]> {
  const q = rfq.questions || {};
  if (Array.isArray(q.sinks) && q.sinks.length > 0) return q.sinks;
  // fallback: build a single sink from the legacy spec
  const s = q.spec || {};
  return [{
    id: 'legacy-1',
    name: s.modelName || rfq.title_he || 'כיור',
    dimensions: s.dimensions,
    stone: s.stone,
    notes: s.notes,
  }];
}

export interface CreateRfqInput {
  title_he: string;
  project_ref?: string | null;
  customer_hint?: string | null;
  sinks?: RfqSink[];
  spec?: RfqSpec; // still accepted for backward-compat
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

  const questions: { spec?: RfqSpec; sinks?: RfqSink[] } = {};
  if (Array.isArray(input.sinks) && input.sinks.length > 0) questions.sinks = input.sinks;
  if (input.spec) questions.spec = input.spec;

  const res = await sb.from('rfqs').insert({
    token,
    title_he: input.title_he.trim(),
    project_ref: input.project_ref?.trim() || null,
    customer_hint: input.customer_hint?.trim() || null,
    questions,
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

  const rfqRes = await sb.from('rfqs').select('id, title_he, project_ref, customer_hint').eq('token', input.token).single();
  if (rfqRes.error || !rfqRes.data) return { ok: false, error: 'RFQ not found' };
  const rfqId = rfqRes.data.id as string;
  const title = (rfqRes.data.title_he as string) || 'RFQ';
  const projectRef = (rfqRes.data.project_ref as string) || title;

  const insRes = await sb.from('rfq_responses').insert({
    rfq_id: rfqId,
    line_items: input.lineItems,
    total_ils: input.totalIls,
    remark_he: input.remarkHe?.trim() || null,
    ales_photo_urls: input.sitePhotoUrls && input.sitePhotoUrls.length > 0 ? input.sitePhotoUrls : null,
  }).select('id').single();
  if (insRes.error || !insRes.data) return { ok: false, error: insRes.error?.message || 'no response row' };
  const responseId = insRes.data.id as string;

  let offerId: string | null = null;
  try {
    const offer = await createSupplierOffer({
      supplier_name: 'אלס - ARVO',
      trade: 'ייצור כיורי שיש',
      project_ref: projectRef,
      source: 'ales_rfq',
      raw_message: input.remarkHe?.trim() || undefined,
      line_items: input.lineItems,
      total_ils: input.totalIls,
      save_to_directory: true,
    });
    if (offer.ok) offerId = offer.id || null;
    else console.error('[submitRfqResponse] createSupplierOffer failed:', offer.error);
  } catch (e) {
    console.error('[submitRfqResponse] offer creation threw (non-blocking):', e);
  }

  if (offerId) {
    await sb.from('rfq_responses').update({ supplier_offer_id: offerId }).eq('id', responseId);
  }

  const updRes = await sb.from('rfqs').update({ status: 'answered', updated_at: new Date().toISOString() }).eq('id', rfqId);
  if (updRes.error) return { ok: false, error: updRes.error.message };

  // auto-create a pipeline job at stage 'priced' (non-blocking)
  try {
    await createJob({
      title_he: title,
      customer_name: (rfqRes.data.customer_hint as string) || undefined,
      rfq_id: rfqId,
      supplier_offer_id: offerId || undefined,
      stage: 'priced',
      ales_cost: input.totalIls,
    });
  } catch (e) {
    console.error('[submitRfqResponse] createJob threw (non-blocking):', e);
  }

  // fire the alert email (non-blocking)
  await sendAlesAlertEmail({ title, total: input.totalIls, lineItems: input.lineItems, remark: input.remarkHe });

  return { ok: true };
}
