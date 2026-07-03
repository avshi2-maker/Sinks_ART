'use server';

// src/lib/po/createWorkOrderFromSketch.ts
// Turn a saved gallery sketch into an Ales work order, freezing the FULL pricing snapshot
// that the engine already computed (true cost, base offer, art premium, 50/50 split,
// Ales total, Avshi total) + the material cut list. No recompute here — the engine is the
// single source of truth; this function just persists what the user saw on screen.
//
// Stored on production_orders.cut_list (jsonb) as an AlesWorkOrderSnapshot.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createPO } from './poData';
import type { MaterialResult } from '@/lib/offers/materialCalc';
import type { PricingResult } from '@/lib/pricing/alesCostTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface WorkOrderResult { ok: boolean; error?: string; poId?: string; poNumber?: string; }

// What the engine sends to freeze a work order. days + cutList travel alongside the
// PricingResult so the document + future edits have the complete picture.
export interface CreateWorkOrderInput {
  sketchId: string;
  days: number;              // days-per-sink used in the pricing
  cutList: MaterialResult;   // the 8-panel material snapshot for this sink
  pricing: PricingResult;    // the full engine result (true cost, offers, split, totals)
}

// The frozen shape stored in production_orders.cut_list. Self-contained so the 3-page
// Ales document renders entirely from this snapshot, no recompute.
export interface AlesWorkOrderSnapshot {
  version: 2;
  sketchId: string;
  label: string;
  sketchSvg: string;
  days: number;
  cutList: MaterialResult;
  pricing: PricingResult;
  createdAtIso: string;
}

export async function createWorkOrderFromSketch(input: CreateWorkOrderInput): Promise<WorkOrderResult> {
  const { sketchId, days, cutList, pricing } = input;
  if (!sketchId) return { ok: false, error: 'missing sketchId' };
  if (!pricing) return { ok: false, error: 'missing pricing result' };

  // 1. read the sketch (for svg + label + customer/project links)
  const res = await sb()
    .from('demo_trials')
    .select('sketch_svg, inputs_jsonb, title_he, customer_id, project_id')
    .eq('id', sketchId).eq('kind', 'sketch').maybeSingle();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'sketch not found' };
  const s = res.data;
  if (!s.sketch_svg) return { ok: false, error: 'לשרטוט אין SVG שמור' };

  const spec = (s.inputs_jsonb || {}) as Record<string, unknown>;
  const label = (s.title_he && String(s.title_he).trim()) || 'כיור';

  // 2. build the frozen snapshot from what the engine already computed
  const snapshot: AlesWorkOrderSnapshot = {
    version: 2,
    sketchId,
    label,
    sketchSvg: s.sketch_svg,
    days,
    cutList,
    pricing,
    createdAtIso: new Date().toISOString(),
  };

  // 3. create the PO (spec + svg as before; agreed cost = the customer final offer)
  const po = await createPO({
    customerId: s.customer_id || null,
    projectId: s.project_id || null,
    sketchSpec: spec,
    sketchSvg: s.sketch_svg,
    agreedCostIls: pricing.finalOfferIls,
  });
  if (!po.ok || !po.id) return { ok: false, error: po.error };

  // 4. freeze the snapshot onto the new PO row
  const upd = await sb().from('production_orders').update({ cut_list: snapshot }).eq('id', po.id);
  if (upd.error) return { ok: false, error: upd.error.message };

  revalidatePath('/po');
  return { ok: true, poId: po.id, poNumber: po.poNumber };
}
