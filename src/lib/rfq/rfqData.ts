'use server';

// src/lib/rfq/rfqData.ts
// Ales RFQ pipeline: create an RFQ (Avshi side), fetch by token (Ales mobile page),
// submit a response (Ales side) -> becomes a supplier offer to review.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// A media asset shown to Ales (customer photo/video/voice, or the sketch).
export interface RfqAsset {
  url: string;
  kind: 'image' | 'video' | 'audio' | 'sketch' | 'file';
  label?: string;
}

// The sink spec snapshot Ales sees (read-only context).
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
  // url-safe random token, ~22 chars
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
