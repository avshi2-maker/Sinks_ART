'use server';

// src/lib/po/createWorkOrderFromSketch.ts
// Option A pipeline: turn a saved gallery sketch into an Ales work order.
// Reads the sketch's SVG + spec + customer/project, creates a PO carrying them,
// returns the new PO id so the caller can open /po/[id]/ales.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createPO } from './poData';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface WorkOrderResult { ok: boolean; error?: string; poId?: string; poNumber?: string; }

export async function createWorkOrderFromSketch(sketchId: string): Promise<WorkOrderResult> {
  if (!sketchId) return { ok: false, error: 'missing sketch id' };

  const res = await sb()
    .from('demo_trials')
    .select('sketch_svg, inputs_jsonb, title_he, customer_id, project_id')
    .eq('id', sketchId).eq('kind', 'sketch').maybeSingle();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'sketch not found' };

  const s = res.data;
  if (!s.sketch_svg) return { ok: false, error: 'לשרטוט אין SVG שמור' };

  const spec = (s.inputs_jsonb || {}) as Record<string, unknown>;
  if (s.title_he) spec.title = s.title_he;

  const po = await createPO({
    customerId: s.customer_id || null,
    projectId: s.project_id || null,
    sketchSpec: spec,
    sketchSvg: s.sketch_svg,
  });
  if (!po.ok) return { ok: false, error: po.error };

  revalidatePath('/po');
  return { ok: true, poId: po.id, poNumber: po.poNumber };
}
