'use server';

// src/lib/offers/materialCalcToSketch.ts
// Attach a material-calc summary to a gallery sketch (reference + future use).
// Appends a compact stamped line to the sketch's notes_he (visible on the gallery card)
// and stores the structured result under inputs_jsonb.material_calc_snapshot.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { MaterialResult } from './materialCalc';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface SketchPickLite { id: string; title_he: string | null; }

export async function fetchSketchesForPicker(): Promise<SketchPickLite[]> {
  const res = await sb().from('demo_trials')
    .select('id, title_he')
    .eq('kind', 'sketch').eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchSketchesForPicker]', res.error.message); return []; }
  return (res.data || []) as SketchPickLite[];
}

export interface SaveCalcResult { ok: boolean; error?: string; }

export async function saveMaterialCalcToSketch(sketchId: string, calc: MaterialResult, lenMm: number, widMm: number): Promise<SaveCalcResult> {
  if (!sketchId) return { ok: false, error: 'missing sketchId' };
  const db = sb();

  const cur = await db.from('demo_trials').select('notes_he, inputs_jsonb').eq('id', sketchId).maybeSingle();
  if (cur.error || !cur.data) return { ok: false, error: cur.error?.message || 'sketch not found' };

  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  const line = '📐 חומר (' + stamp + '): ' + calc.sheets + ' לוחות · ' +
    (Math.round(calc.neededM2 * 100) / 100).toFixed(2) + ' מ"ר · ₪' +
    Math.round(calc.totalIls).toLocaleString('he-IL');

  const existingNotes = (cur.data.notes_he as string) || '';
  const notes = existingNotes ? existingNotes + '\n' + line : line;

  const spec = (cur.data.inputs_jsonb || {}) as Record<string, unknown>;
  spec.material_calc_snapshot = { lenMm, widMm, calc, savedAtIso: d.toISOString() };

  const upd = await db.from('demo_trials')
    .update({ notes_he: notes, inputs_jsonb: spec, updated_at: d.toISOString() })
    .eq('id', sketchId);
  if (upd.error) return { ok: false, error: upd.error.message };

  revalidatePath('/demos');
  return { ok: true };
}
