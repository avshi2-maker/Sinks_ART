'use server';

// src/lib/purchasing/trabelsiPoData.ts
// Data for the Trabelsi purchase-order builder: every sketch that carries a saved
// material_calc_snapshot (created by the 💾 button in the material calculator).
// The builder lists them, sums sheets across selected sinks, and prices the order.

import { createClient } from '@supabase/supabase-js';
import type { MaterialResult } from '@/lib/offers/materialCalc';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface PoSketchOption {
  id: string;
  title: string;
  lenMm: number;
  widMm: number;
  sheets: number;
  neededM2: number;
  savedAt: string;
}

export async function fetchSketchesWithMaterial(): Promise<PoSketchOption[]> {
  const res = await sb().from('demo_trials')
    .select('id, title_he, inputs_jsonb')
    .eq('kind', 'sketch').eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchSketchesWithMaterial]', res.error.message); return []; }

  const out: PoSketchOption[] = [];
  for (const row of res.data || []) {
    const spec = (row.inputs_jsonb || {}) as Record<string, unknown>;
    const snap = spec.material_calc_snapshot as
      | { lenMm?: number; widMm?: number; calc?: MaterialResult; savedAtIso?: string }
      | undefined;
    if (!snap || !snap.calc) continue;
    out.push({
      id: row.id as string,
      title: (row.title_he as string) || 'שרטוט',
      lenMm: Number(snap.lenMm) || 0,
      widMm: Number(snap.widMm) || 0,
      sheets: Number(snap.calc.sheets) || 0,
      neededM2: Number(snap.calc.neededM2) || 0,
      savedAt: String(snap.savedAtIso || ''),
    });
  }
  return out;
}
