'use server';

// src/lib/offers/materialSettings.ts
// Read + update the single-row Trabelsi material settings.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { MaterialSettings } from './materialCalc';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

const DEFAULTS: MaterialSettings = { sheetLenCm: 270, sheetWidCm: 120, pricePerM2: 199, crateIls: 980, deliveryIls: 350, vatPct: 18 };

export async function fetchMaterialSettings(): Promise<MaterialSettings> {
  const res = await sb().from('trabelsi_material_settings')
    .select('sheet_len_cm, sheet_wid_cm, price_per_m2, crate_ils, delivery_ils, vat_pct')
    .eq('id', 1).maybeSingle();
  if (res.error || !res.data) { console.error('[fetchMaterialSettings]', res.error?.message); return DEFAULTS; }
  const d = res.data;
  return {
    sheetLenCm: Number(d.sheet_len_cm), sheetWidCm: Number(d.sheet_wid_cm),
    pricePerM2: Number(d.price_per_m2), crateIls: Number(d.crate_ils),
    deliveryIls: Number(d.delivery_ils), vatPct: Number(d.vat_pct),
  };
}

export async function updateMaterialSettings(s: MaterialSettings): Promise<{ ok: boolean; error?: string }> {
  const res = await sb().from('trabelsi_material_settings').update({
    sheet_len_cm: s.sheetLenCm, sheet_wid_cm: s.sheetWidCm, price_per_m2: s.pricePerM2,
    crate_ils: s.crateIls, delivery_ils: s.deliveryIls, vat_pct: s.vatPct,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/material-calc');
  return { ok: true };
}
