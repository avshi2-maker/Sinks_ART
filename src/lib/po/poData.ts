'use server';

// src/lib/po/poData.ts
// Production Order engine: numbering (PO-YYYY-####), create, fetch, issue, log appends.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface POAsset { url: string; type: string; public_id: string; label: string; uploaded_at: string; }
export interface ChangeOrder { seq: string; date: string; description: string; cost_delta: number; }
export interface Amendment { seq: string; date: string; description: string; }
export interface Remark { date: string; author: string; text: string; }

export interface ProductionOrder {
  id: string;
  po_number: string;
  status: string;
  issued_at: string | null;
  customer_id: string | null;
  project_id: string | null;
  ship_to_name: string | null;
  ship_to_phone: string | null;
  ship_to_address: string | null;
  ship_to_city: string | null;
  sketch_spec: Record<string, unknown> | null;
  sketch_svg: string | null;
  agreed_cost_ils: number;
  change_orders: ChangeOrder[];
  amendments: Amendment[];
  remarks_log: Remark[];
  ales_confirmation: string | null;
  ales_confirmed_at: string | null;
  assets: POAsset[];
  created_at: string;
}

export interface POResult { ok: boolean; error?: string; id?: string; poNumber?: string; }

// Reserve the next PO number for the current year (gapless sequence).
async function nextPoNumber(client: ReturnType<typeof sb>): Promise<string> {
  const year = new Date().getFullYear();
  const cur = await client.from('po_counter').select('last_seq').eq('year', year).maybeSingle();
  let next = 1;
  if (cur.data) {
    next = (cur.data.last_seq as number) + 1;
    await client.from('po_counter').update({ last_seq: next }).eq('year', year);
  } else {
    await client.from('po_counter').insert({ year, last_seq: 1 });
  }
  return 'PO-' + year + '-' + String(next).padStart(4, '0');
}

export interface CreatePOInput {
  customerId?: string | null;
  projectId?: string | null;
  shipToName?: string;
  shipToPhone?: string;
  shipToAddress?: string;
  shipToCity?: string;
  sketchSpec?: Record<string, unknown>;
  sketchSvg?: string;
  agreedCostIls?: number;
}

export async function createPO(input: CreatePOInput): Promise<POResult> {
  const client = sb();
  const poNumber = await nextPoNumber(client);
  const res = await client.from('production_orders').insert({
    po_number: poNumber,
    status: 'draft',
    customer_id: input.customerId || null,
    project_id: input.projectId || null,
    ship_to_name: input.shipToName || null,
    ship_to_phone: input.shipToPhone || null,
    ship_to_address: input.shipToAddress || null,
    ship_to_city: input.shipToCity || null,
    sketch_spec: input.sketchSpec || null,
    sketch_svg: input.sketchSvg || null,
    agreed_cost_ils: input.agreedCostIls || 0,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/po');
  return { ok: true, id: res.data.id as string, poNumber };
}

export async function fetchPOs(): Promise<ProductionOrder[]> {
  const res = await sb().from('production_orders').select('*').order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchPOs]', res.error.message); return []; }
  return (res.data || []) as ProductionOrder[];
}

export async function fetchPO(id: string): Promise<ProductionOrder | null> {
  const res = await sb().from('production_orders').select('*').eq('id', id).maybeSingle();
  if (res.error) { console.error('[fetchPO]', res.error.message); return null; }
  return (res.data as ProductionOrder) || null;
}

// Issue the PO — locks it as an official record.
export async function issuePO(id: string): Promise<POResult> {
  const res = await sb().from('production_orders').update({ status: 'issued', issued_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/po/' + id);
  return { ok: true, id };
}

async function appendArray(id: string, column: 'change_orders' | 'amendments' | 'remarks_log' | 'assets', item: unknown): Promise<POResult> {
  const client = sb();
  const cur = await client.from('production_orders').select(column).eq('id', id).maybeSingle();
  if (cur.error || !cur.data) return { ok: false, error: cur.error?.message || 'not found' };
  const arr = (cur.data as Record<string, unknown[]>)[column] || [];
  arr.push(item);
  const res = await client.from('production_orders').update({ [column]: arr, updated_at: new Date().toISOString() }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/po/' + id);
  return { ok: true, id };
}

export async function addChangeOrder(id: string, description: string, costDelta: number, existingCount: number): Promise<POResult> {
  return appendArray(id, 'change_orders', { seq: 'CO-' + (existingCount + 1), date: new Date().toISOString(), description, cost_delta: costDelta });
}

export async function addAmendment(id: string, description: string, existingCount: number): Promise<POResult> {
  return appendArray(id, 'amendments', { seq: 'AM-' + (existingCount + 1), date: new Date().toISOString(), description });
}

export async function addRemark(id: string, author: string, text: string): Promise<POResult> {
  return appendArray(id, 'remarks_log', { date: new Date().toISOString(), author, text });
}

export async function addAsset(id: string, url: string, type: string, publicId: string, label: string): Promise<POResult> {
  return appendArray(id, 'assets', { url, type, public_id: publicId, label, uploaded_at: new Date().toISOString() });
}

export async function setAlesConfirmation(id: string, text: string): Promise<POResult> {
  const res = await sb().from('production_orders').update({ ales_confirmation: text, ales_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/po/' + id);
  return { ok: true, id };
}

export async function updatePOCost(id: string, agreedCostIls: number): Promise<POResult> {
  const res = await sb().from('production_orders').update({ agreed_cost_ils: agreedCostIls, updated_at: new Date().toISOString() }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/po/' + id);
  return { ok: true, id };
}

export async function updatePOShipTo(id: string, fields: { ship_to_name?: string; ship_to_phone?: string; ship_to_address?: string; ship_to_city?: string }): Promise<POResult> {
  const res = await sb().from('production_orders').update({
    ship_to_name: fields.ship_to_name ?? null,
    ship_to_phone: fields.ship_to_phone ?? null,
    ship_to_address: fields.ship_to_address ?? null,
    ship_to_city: fields.ship_to_city ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/po/' + id);
  return { ok: true, id };
}
export async function deletePO(id: string): Promise<POResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const res = await sb().from('production_orders').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/po');
  return { ok: true, id };
}