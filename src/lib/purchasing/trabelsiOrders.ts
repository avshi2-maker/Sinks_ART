'use server';

// src/lib/purchasing/trabelsiOrders.ts
// The Trabelsi purchasing register: save orders (auto TRB-YYYY-NNNN numerator),
// list them, update status (draft/sent/approved/paused/supplied/archived) + remarks.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type TrabelsiStatus = 'draft' | 'sent' | 'approved' | 'paused' | 'supplied' | 'archived';

export interface TrabelsiOrder {
  id: string;
  order_number: string;
  sketch_titles: string | null;
  sheets: number;
  area_m2: number;
  price_per_m2: number;
  crate_ils: number;
  delivery_ils: number;
  vat_pct: number;
  total_ils: number;
  notes_he: string | null;
  po_text: string | null;
  status: TrabelsiStatus;
  remarks_he: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveTrabelsiInput {
  sketchTitles: string;
  sheets: number;
  areaM2: number;
  pricePerM2: number;
  crateIls: number;
  deliveryIls: number;
  vatPct: number;
  totalIls: number;
  notesHe: string;
  poText: string;
}

export interface SaveTrabelsiResult { ok: boolean; orderNumber?: string; id?: string; error?: string; }

export async function saveTrabelsiOrder(input: SaveTrabelsiInput): Promise<SaveTrabelsiResult> {
  const db = sb();
  const year = new Date().getFullYear();

  // numerator: TRB-YYYY-NNNN, running count within the year
  const countRes = await db.from('trabelsi_orders')
    .select('id', { count: 'exact', head: true })
    .like('order_number', 'TRB-' + year + '-%');
  const next = (countRes.count || 0) + 1;
  const orderNumber = 'TRB-' + year + '-' + String(next).padStart(4, '0');

  const ins = await db.from('trabelsi_orders').insert({
    order_number: orderNumber,
    sketch_titles: input.sketchTitles || null,
    sheets: input.sheets,
    area_m2: input.areaM2,
    price_per_m2: input.pricePerM2,
    crate_ils: input.crateIls,
    delivery_ils: input.deliveryIls,
    vat_pct: input.vatPct,
    total_ils: input.totalIls,
    notes_he: input.notesHe || null,
    po_text: input.poText || null,
    status: 'draft',
  }).select('id').single();

  if (ins.error) return { ok: false, error: ins.error.message };
  revalidatePath('/trabelsi-po');
  return { ok: true, orderNumber, id: ins.data.id as string };
}

export async function updateTrabelsiOrder(id: string, input: SaveTrabelsiInput): Promise<SaveTrabelsiResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const db = sb();
  const cur = await db.from('trabelsi_orders').select('order_number').eq('id', id).maybeSingle();
  if (cur.error || !cur.data) return { ok: false, error: cur.error?.message || 'order not found' };
  const upd = await db.from('trabelsi_orders').update({
    sketch_titles: input.sketchTitles || null,
    sheets: input.sheets,
    area_m2: input.areaM2,
    price_per_m2: input.pricePerM2,
    crate_ils: input.crateIls,
    delivery_ils: input.deliveryIls,
    vat_pct: input.vatPct,
    total_ils: input.totalIls,
    notes_he: input.notesHe || null,
    po_text: input.poText || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (upd.error) return { ok: false, error: upd.error.message };
  revalidatePath('/trabelsi-po');
  return { ok: true, orderNumber: cur.data.order_number as string, id };
}

export async function fetchTrabelsiOrders(): Promise<TrabelsiOrder[]> {
  const res = await sb().from('trabelsi_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchTrabelsiOrders]', res.error.message); return []; }
  return (res.data || []) as TrabelsiOrder[];
}

export interface UpdateResult { ok: boolean; error?: string; }

export async function updateTrabelsiStatus(id: string, status: TrabelsiStatus): Promise<UpdateResult> {
  const res = await sb().from('trabelsi_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/trabelsi-po');
  return { ok: true };
}

export async function updateTrabelsiRemarks(id: string, remarksHe: string): Promise<UpdateResult> {
  const res = await sb().from('trabelsi_orders')
    .update({ remarks_he: remarksHe || null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/trabelsi-po');
  return { ok: true };
}
