'use server';

// src/lib/options/optionsCatalog.ts
// Phase 28 — options catalog (price book): fetch all + save one row.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface OptionRow {
  id: string;
  chapter: string;
  name_he: string;
  ales_cost: number;
  customer_price: number;
  note_he: string | null;
  active: boolean;
  sort_order: number;
}

export async function fetchOptions(): Promise<OptionRow[]> {
  const sb = getServerSupabase();
  const res = await sb.from('options_catalog').select('*').order('sort_order', { ascending: true });
  if (res.error) {
    console.error('[fetchOptions]', res.error.message);
    return [];
  }
  return (res.data || []) as OptionRow[];
}

export interface SaveOptionInput {
  id: string;
  ales_cost: number;
  customer_price: number;
  note_he: string | null;
  active: boolean;
}

export interface SaveResult { ok: boolean; error?: string; }

export async function saveOption(input: SaveOptionInput): Promise<SaveResult> {
  if (!input.id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb
    .from('options_catalog')
    .update({
      ales_cost: Number(input.ales_cost) || 0,
      customer_price: Number(input.customer_price) || 0,
      note_he: input.note_he?.trim() || null,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/options');
  return { ok: true };
}
