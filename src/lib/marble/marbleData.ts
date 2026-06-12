'use server';

// src/lib/marble/marbleData.ts
// Marble swatch library — CRUD for the visual stone picker.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface MarbleSwatch {
  id: string;
  name_en: string;
  name_he: string | null;
  image_url: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MarbleResult { ok: boolean; error?: string; id?: string; }

export async function fetchSwatches(): Promise<MarbleSwatch[]> {
  const res = await sb().from('marble_swatches').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('name_en', { ascending: true });
  if (res.error) { console.error('[fetchSwatches]', res.error.message); return []; }
  return (res.data || []) as MarbleSwatch[];
}

export async function addSwatch(nameEn: string, nameHe: string, imageUrl: string, category: string): Promise<MarbleResult> {
  const res = await sb().from('marble_swatches').insert({
    name_en: nameEn, name_he: nameHe || null, image_url: imageUrl, category: category || null,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/marble');
  revalidatePath('/sketch');
  return { ok: true, id: res.data.id as string };
}

export async function deleteSwatch(id: string): Promise<MarbleResult> {
  const res = await sb().from('marble_swatches').update({ is_active: false }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/marble');
  revalidatePath('/sketch');
  return { ok: true, id };
}
