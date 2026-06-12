'use server';

// src/lib/addons/addonsData.ts
// Add-ons catalog — CRUD for the change-order preset list (and future quotes).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface Addon {
  id: string;
  name_he: string;
  category: string | null;
  default_price_ils: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AddonResult { ok: boolean; error?: string; id?: string; }

export async function fetchAddons(): Promise<Addon[]> {
  const res = await sb().from('addons_catalog').select('*').eq('is_active', true).order('sort_order', { ascending: true });
  if (res.error) { console.error('[fetchAddons]', res.error.message); return []; }
  return (res.data || []) as Addon[];
}

export async function addAddon(nameHe: string, category: string, price: number): Promise<AddonResult> {
  const res = await sb().from('addons_catalog').insert({
    name_he: nameHe, category: category || null, default_price_ils: price || 0,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/addons');
  revalidatePath('/po');
  return { ok: true, id: res.data.id as string };
}

export async function deleteAddon(id: string): Promise<AddonResult> {
  const res = await sb().from('addons_catalog').update({ is_active: false }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/addons');
  return { ok: true, id };
}
