'use server';

// src/lib/quotes/rfqImages.ts
// Manage RFQ reference image thumbnails on a quote (jsonb array on quotes.rfq_images).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface RfqImage { url: string; label: string; uploaded_at: string; }
export interface RfqResult { ok: boolean; error?: string; }

export async function addRfqImage(quoteId: string, url: string, label: string): Promise<RfqResult> {
  const client = sb();
  const cur = await client.from('quotes').select('rfq_images').eq('id', quoteId).maybeSingle();
  if (cur.error || !cur.data) return { ok: false, error: cur.error?.message || 'quote not found' };
  const arr = (cur.data.rfq_images as RfqImage[]) || [];
  arr.push({ url, label: label || 'הפניה', uploaded_at: new Date().toISOString() });
  const res = await client.from('quotes').update({ rfq_images: arr, updated_at: new Date().toISOString() }).eq('id', quoteId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/quotes/' + quoteId);
  return { ok: true };
}

export async function removeRfqImage(quoteId: string, index: number): Promise<RfqResult> {
  const client = sb();
  const cur = await client.from('quotes').select('rfq_images').eq('id', quoteId).maybeSingle();
  if (cur.error || !cur.data) return { ok: false, error: cur.error?.message || 'quote not found' };
  const arr = (cur.data.rfq_images as RfqImage[]) || [];
  arr.splice(index, 1);
  const res = await client.from('quotes').update({ rfq_images: arr, updated_at: new Date().toISOString() }).eq('id', quoteId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/quotes/' + quoteId);
  return { ok: true };
}
