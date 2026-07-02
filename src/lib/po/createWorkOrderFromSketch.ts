'use server';

// src/lib/po/createWorkOrderFromSketch.ts
// Turn a saved gallery sketch into an Ales work order — now with the material cut list
// and the frozen finance snapshot (order amount + commission -> Ales profit).
//
// FLOW: sketch spec -> sketchSpecToDims (mm->cm) -> calcMaterial (8-panel cut list)
//       -> one 'sink' line item -> buildFinance -> store snapshot on PO.cut_list (jsonb).
// Built multi-item ready: lineItems is an array; today it holds one sink, later it can
// hold more sinks + addons + doors (see workOrderTypes.ts).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createPO } from './poData';
import { calcMaterial, type MaterialFactors, type MaterialSettings } from '@/lib/offers/materialCalc';
import { fetchMaterialSettings } from '@/lib/offers/materialSettings';
import { sketchSpecToDims, sketchLabel } from './sketchSpecToDims';
import { buildFinance } from './workOrderFinance';
import type { WorkOrderLine } from './workOrderTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Verified Goldman factors — reproduce 4 sheets / 12.96 m² / ₪2,579.
// Passed in from the finalize panel so a job can override per-order; these are the defaults.
const DEFAULT_FACTORS: MaterialFactors = { laminate: true, wastePct: 12, miterPct: 8, slopePct: 3 };

export interface WorkOrderResult { ok: boolean; error?: string; poId?: string; poNumber?: string; }

export interface CreateWorkOrderInput {
  sketchId: string;
  orderAmountIls: number;         // what the customer pays (from finalize panel)
  commissionIls: number;          // Marble Art commission (from finalize panel)
  factors?: MaterialFactors;      // optional per-job override of waste/miter/slope/laminate
}

export async function createWorkOrderFromSketch(input: CreateWorkOrderInput): Promise<WorkOrderResult> {
  const { sketchId } = input;
  if (!sketchId) return { ok: false, error: 'missing sketchId' };

  // 1. read the sketch
  const res = await sb()
    .from('demo_trials')
    .select('sketch_svg, inputs_jsonb, title_he, customer_id, project_id')
    .eq('id', sketchId).eq('kind', 'sketch').maybeSingle();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'sketch not found' };
  const s = res.data;
  if (!s.sketch_svg) return { ok: false, error: 'לשרטוט אין SVG שמור' };

  const spec = (s.inputs_jsonb || {}) as Record<string, unknown>;

  // 2. map spec -> dims, run the material calc (same math as /material-calc)
  const settings: MaterialSettings = await fetchMaterialSettings();
  const dims = sketchSpecToDims(spec);
  const factors = input.factors || DEFAULT_FACTORS;
  const cutList = calcMaterial(dims, factors, settings);

  // 3. build the sink line item (multi-item ready — this is one of a future array)
  const sinkLine: WorkOrderLine = {
    kind: 'sink',
    label: sketchLabel(spec, s.title_he || 'כיור'),
    materialIls: cutList.totalIls,          // Trabelsi material cost incl VAT for this sink
    sketchId,
    sketchSvg: s.sketch_svg,
    cutList,
  };

  // 4. freeze the finance snapshot
  const finance = buildFinance({
    lines: [sinkLine],
    orderAmountIls: input.orderAmountIls,
    commissionIls: input.commissionIls,
  });

  // 5. create the PO, storing spec + svg (as before) AND the finance snapshot in cut_list
  const po = await createPO({
    customerId: s.customer_id || null,
    projectId: s.project_id || null,
    sketchSpec: spec,
    sketchSvg: s.sketch_svg,
  });
  if (!po.ok || !po.id) return { ok: false, error: po.error };

  // 6. write the finance snapshot onto the new PO row
  const upd = await sb().from('production_orders').update({ cut_list: finance }).eq('id', po.id);
  if (upd.error) return { ok: false, error: upd.error.message };

  revalidatePath('/po');
  return { ok: true, poId: po.id, poNumber: po.poNumber };
}
