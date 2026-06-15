'use server';

// src/lib/suppliers/suppliersData.ts
// Suppliers directory + captured supplier price offers (+ customer/commission finalize for the turnkey offer).
// Mirrors leadsData.ts conventions: getServerSupabase() with NEXT_PUBLIC_* env, anon RLS, revalidatePath.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface OfferLine { desc: string; price: number; }

export interface SupplierRow {
  id: string;
  name: string;
  phone: string | null;
  trade: string | null;
  vat_number: string | null;
  address: string | null;
  logo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierOfferRow {
  id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  customer_id: string | null;
  project_ref: string | null;
  source: string | null;
  raw_message: string | null;
  line_items: OfferLine[];
  total_ils: number;
  status: string;
  api_cost_usd: number;
  // customer + commission (Step 1)
  commission_type: string | null;   // 'pct' | 'fixed'
  commission_value: number | null;
  customer_total_ils: number | null;
  cust_name: string | null;
  cust_phone: string | null;
  cust_address: string | null;
  cust_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierResult { ok: boolean; error?: string; id?: string; }

// ---------- customers (with city, for the turnkey offer) ----------

export interface CustomerPick { id: string; name_he: string; phone: string | null; city: string | null; }

export async function fetchCustomersForOffer(): Promise<CustomerPick[]> {
  const sb = getServerSupabase();
  const res = await sb.from('customers').select('*').is('archived_at', null).order('name_he', { ascending: true });
  if (res.error) { console.error('[fetchCustomersForOffer]', res.error.message); return []; }
  const rows = (res.data || []) as Record<string, unknown>[];
  return rows.map((r) => ({ id: String(r.id), name_he: (r.name_he as string) || (r.name as string) || '', phone: (r.phone as string) || null, city: (r.city as string) || (r.address as string) || null }));
}

// ---------- suppliers directory ----------

export interface SupplierLite { id: string; name: string; trade: string | null; phone: string | null; }

export async function fetchSuppliersLite(): Promise<SupplierLite[]> {
  const sb = getServerSupabase();
  const res = await sb.from('suppliers').select('id, name, trade, phone').order('name', { ascending: true });
  if (res.error) { console.error('[fetchSuppliersLite]', res.error.message); return []; }
  return (res.data || []) as SupplierLite[];
}

export async function fetchSuppliers(): Promise<SupplierRow[]> {
  const sb = getServerSupabase();
  const res = await sb.from('suppliers').select('*').order('name', { ascending: true });
  if (res.error) { console.error('[fetchSuppliers]', res.error.message); return []; }
  return (res.data || []) as SupplierRow[];
}

export interface SupplierInput {
  name: string;
  phone?: string;
  trade?: string;
  vat_number?: string;
  address?: string;
  notes?: string;
}

// Create OR reuse a supplier by exact name match (so repeat offers from Ales don't duplicate the directory entry).
export async function upsertSupplierByName(input: SupplierInput): Promise<SupplierResult> {
  const name = (input.name || '').trim();
  if (!name) return { ok: false, error: 'שם ספק חסר' };
  const sb = getServerSupabase();

  const existing = await sb.from('suppliers').select('id').eq('name', name).limit(1);
  if (!existing.error && existing.data && existing.data.length) {
    return { ok: true, id: existing.data[0].id as string };
  }
  const res = await sb.from('suppliers').insert({
    name,
    phone: input.phone?.trim() || null,
    trade: input.trade?.trim() || null,
    vat_number: input.vat_number?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/suppliers');
  return { ok: true, id: res.data.id as string };
}

export async function updateSupplier(id: string, patch: Partial<SupplierInput>): Promise<SupplierResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('suppliers').update({
    ...('name' in patch ? { name: patch.name?.trim() || '' } : {}),
    ...('phone' in patch ? { phone: patch.phone?.trim() || null } : {}),
    ...('trade' in patch ? { trade: patch.trade?.trim() || null } : {}),
    ...('vat_number' in patch ? { vat_number: patch.vat_number?.trim() || null } : {}),
    ...('address' in patch ? { address: patch.address?.trim() || null } : {}),
    ...('notes' in patch ? { notes: patch.notes?.trim() || null } : {}),
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/suppliers');
  return { ok: true, id };
}

export async function deleteSupplier(id: string): Promise<SupplierResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('suppliers').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/suppliers');
  return { ok: true };
}

// ---------- supplier offers ----------

export interface CreateOfferInput {
  supplier_name?: string;
  supplier_phone?: string;
  trade?: string;
  project_ref?: string;
  customer_id?: string | null;
  source?: string;
  raw_message?: string;
  line_items: OfferLine[];
  total_ils: number;
  api_cost_usd?: number;
  save_to_directory?: boolean;
}

export async function createSupplierOffer(input: CreateOfferInput): Promise<SupplierResult> {
  const sb = getServerSupabase();

  let supplierId: string | null = null;
  if (input.save_to_directory && (input.supplier_name || '').trim()) {
    const up = await upsertSupplierByName({
      name: input.supplier_name!.trim(),
      phone: input.supplier_phone,
      trade: input.trade,
    });
    if (up.ok) supplierId = up.id || null;
  }

  const items = Array.isArray(input.line_items) ? input.line_items : [];
  const total = Number(input.total_ils) || items.reduce((s, it) => s + (Number(it.price) || 0), 0);

  const res = await sb.from('supplier_offers').insert({
    supplier_id: supplierId,
    supplier_name: input.supplier_name?.trim() || null,
    customer_id: input.customer_id || null,
    project_ref: input.project_ref?.trim() || null,
    source: input.source || 'whatsapp',
    raw_message: input.raw_message || null,
    line_items: items,
    total_ils: total,
    status: 'new',
    api_cost_usd: Number(input.api_cost_usd) || 0,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/suppliers');
  return { ok: true, id: res.data.id as string };
}

export async function fetchSupplierOffers(): Promise<SupplierOfferRow[]> {
  const sb = getServerSupabase();
  const res = await sb.from('supplier_offers').select('*').order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchSupplierOffers]', res.error.message); return []; }
  return (res.data || []) as SupplierOfferRow[];
}

export async function fetchSupplierOffer(id: string): Promise<SupplierOfferRow | null> {
  if (!id) return null;
  const sb = getServerSupabase();
  const res = await sb.from('supplier_offers').select('*').eq('id', id).single();
  if (res.error || !res.data) { console.error('[fetchSupplierOffer]', res.error?.message); return null; }
  return res.data as SupplierOfferRow;
}

export async function updateSupplierOffer(
  id: string,
  patch: { line_items?: OfferLine[]; total_ils?: number; project_ref?: string; customer_id?: string | null; status?: string },
): Promise<SupplierResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.line_items) {
    upd.line_items = patch.line_items;
    upd.total_ils = Number(patch.total_ils) || patch.line_items.reduce((s, it) => s + (Number(it.price) || 0), 0);
  } else if (typeof patch.total_ils === 'number') {
    upd.total_ils = patch.total_ils;
  }
  if ('project_ref' in patch) upd.project_ref = patch.project_ref?.trim() || null;
  if ('customer_id' in patch) upd.customer_id = patch.customer_id || null;
  if ('status' in patch) upd.status = patch.status;

  const res = await sb.from('supplier_offers').update(upd).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/suppliers');
  return { ok: true, id };
}

// Save customer details + commission onto the offer (feeds the turnkey customer offer + ROI later).
export interface FinalizeInput {
  customer_id?: string | null;
  cust_name?: string;
  cust_phone?: string;
  cust_address?: string;
  cust_notes?: string;
  commission_type: string;   // 'pct' | 'fixed'
  commission_value: number;
  customer_total_ils: number;
}

export async function finalizeOfferCustomer(id: string, input: FinalizeInput): Promise<SupplierResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('supplier_offers').update({
    customer_id: input.customer_id || null,
    cust_name: input.cust_name?.trim() || null,
    cust_phone: input.cust_phone?.trim() || null,
    cust_address: input.cust_address?.trim() || null,
    cust_notes: input.cust_notes?.trim() || null,
    commission_type: input.commission_type,
    commission_value: Number(input.commission_value) || 0,
    customer_total_ils: Number(input.customer_total_ils) || 0,
    status: 'drafted',
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/suppliers');
  revalidatePath('/roi');
  return { ok: true, id };
}

export async function deleteSupplierOffer(id: string): Promise<SupplierResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('supplier_offers').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/suppliers');
  return { ok: true };
}

