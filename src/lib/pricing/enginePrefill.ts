'use server';

// src/lib/pricing/enginePrefill.ts
// Persist the pricing-engine INPUTS per sketch (lump lines, mode, commission, premium)
// under demo_trials.inputs_jsonb.pricing_inputs — so reopening a sketch in the engine
// prefills everything the user typed last time. Nothing else in the spec is touched.

import { createClient } from '@supabase/supabase-js';
import type { CostMode, LumpSumLine } from './alesCostTypes';
import type { CommissionMode } from './alesCostCalc';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Everything the engine screen needs to restore itself.
export interface EnginePrefill {
  costMode: CostMode;
  lumpSumLines: LumpSumLine[];
  days: number;
  commissionMode: CommissionMode;
  commissionValue: number;
  artPremiumIls: number;
  savedAtIso: string;
}

export interface SavePrefillResult { ok: boolean; error?: string; }

export async function savePricingInputs(sketchId: string, prefill: EnginePrefill): Promise<SavePrefillResult> {
  if (!sketchId) return { ok: false, error: 'missing sketchId' };
  const db = sb();
  const cur = await db.from('demo_trials').select('inputs_jsonb').eq('id', sketchId).maybeSingle();
  if (cur.error || !cur.data) return { ok: false, error: cur.error?.message || 'sketch not found' };
  const spec = (cur.data.inputs_jsonb || {}) as Record<string, unknown>;
  spec.pricing_inputs = { ...prefill, savedAtIso: new Date().toISOString() };
  const upd = await db.from('demo_trials').update({ inputs_jsonb: spec }).eq('id', sketchId);
  if (upd.error) return { ok: false, error: upd.error.message };
  return { ok: true };
}
