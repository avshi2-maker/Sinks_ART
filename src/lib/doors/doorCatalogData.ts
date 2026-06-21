'use server';

// src/lib/doors/doorCatalogData.ts
// Phase 37 — door_catalog server actions.
// Public configurator reads active stones; CRM editor reads all + mutates.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { DoorStone } from '@/lib/doors/doorCatalogTypes';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface DoorResult { ok: boolean; error?: string; id?: string; }

export async function fetchActiveDoorStones(): Promise<DoorStone[]> {
  const sb = getServerSupabase();
  const res = await sb.from('door_catalog').select('*').eq('is_active', true).order('sort_order', { ascending: true });
  if (res.error) { console.error('[fetchActiveDoorStones]', res.error.message); return []; }
  return (res.data || []) as DoorStone[];
}

export async function fetchAllDoorStones(): Promise<DoorStone[]> {
  const sb = getServerSupabase();
  const res = await sb.from('door_catalog').select('*').order('sort_order', { ascending: true });
  if (res.error) { console.error('[fetchAllDoorStones]', res.error.message); return []; }
  return (res.data || []) as DoorStone[];
}

export interface UpsertDoorStoneInput {
  id?: string | null;
  stone_id: string;
  name_he: string;
  swatch_hex: string;
  render_url?: string | null;
  base_price_ils?: number;
  price_per_sqm_ils?: number;
  sort_order?: number;
  is_active?: boolean;
}

export async function upsertDoorStone(input: UpsertDoorStoneInput): Promise<DoorResult> {
  if (!input.stone_id?.trim() || !input.name_he?.trim()) return { ok: false, error: 'stone_id + name required' };
  const sb = getServerSupabase();
  const row = {
    stone_id: input.stone_id.trim(),
    name_he: input.name_he.trim(),
    swatch_hex: input.swatch_hex || '#CCCCCC',
    render_url: input.render_url || null,
    base_price_ils: typeof input.base_price_ils === 'number' ? input.base_price_ils : 0,
    price_per_sqm_ils: typeof input.price_per_sqm_ils === 'number' ? input.price_per_sqm_ils : 0,
    sort_order: typeof input.sort_order === 'number' ? input.sort_order : 0,
    is_active: input.is_active !== false,
  };
  const res = input.id
    ? await sb.from('door_catalog').update(row).eq('id', input.id).select('id').single()
    : await sb.from('door_catalog').upsert(row, { onConflict: 'stone_id' }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'upsert failed' };
  revalidatePath('/doors');
  return { ok: true, id: res.data.id as string };
}

export async function setDoorActive(id: string, active: boolean): Promise<DoorResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('door_catalog').update({ is_active: active }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/doors');
  return { ok: true, id };
}

export async function deleteDoorStone(id: string): Promise<DoorResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('door_catalog').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/doors');
  return { ok: true, id };
}
