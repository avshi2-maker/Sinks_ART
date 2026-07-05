'use server';

// src/lib/offers/createOfferFromEngine.ts
// Bridge: pricing engine result -> existing saveOffer() -> quotes / offers-sent / ROI.
// The customer offer carries only the CLEAN final price (UVW); cost breakdown + split stay internal.
// ROI margin (total_margin) = Avshi's FULL take (15% commission + his premium share).
//
// AUTO-MOVE (Avshi's rule, 04/07): after a successful save, if the sketch is linked to a project,
// advance that project's pipeline status to 'הצעת מחיר נשלחה' — FORWARD ONLY (never downgrades a
// project already at שיחת בירור/תשלום מלא back to offer-sent).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { saveOffer } from './saveOffer';
import type { SaveOfferResult } from './offerTypes';
import type { PricingResult } from '@/lib/pricing/alesCostTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

function ils(n: number): string { return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL'); }

// Pipeline statuses this auto-move is allowed to advance FROM (never downgrade later stages).
const ADVANCE_FROM = ['ליד', 'שיחת בירור'];
const OFFER_SENT_STATUS = 'הצעת מחיר נשלחה';

export interface CreateOfferFromEngineInput {
  sketchId: string;
  pricing: PricingResult;
}

export async function createOfferFromEngine(input: CreateOfferFromEngineInput): Promise<SaveOfferResult> {
  const { sketchId, pricing } = input;
  if (!sketchId) return { ok: false, error: 'missing sketchId' };
  if (!pricing) return { ok: false, error: 'missing pricing' };

  // read the sketch for label + customer/project links
  const res = await sb()
    .from('demo_trials')
    .select('title_he, customer_id, project_id')
    .eq('id', sketchId).eq('kind', 'sketch').maybeSingle();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'sketch not found' };
  const s = res.data;

  // resolve customer name for the quote header
  let customerName: string | null = null;
  if (s.customer_id) {
    const cr = await sb().from('customers').select('name_he').eq('id', s.customer_id).maybeSingle();
    if (!cr.error && cr.data) customerName = (cr.data.name_he as string) || null;
  }

  const title = (s.title_he && String(s.title_he).trim()) || 'כיור אמנותי';

  const grand = Math.round(pricing.finalOfferIls);
  const commission = Math.round(pricing.avshiTotalIls);
  const cost = grand - commission;

  const summaryText = [
    'הצעת מחיר · ' + title,
    'כיור אמנותי בעבודת יד — פורצלן בלמינציה כפולה, גימור אומנותי.',
    '',
    'מחיר סופי: ' + ils(grand) + ' (כולל מע"מ)',
  ].join('\n');

  const saved = await saveOffer({
    customerId: s.customer_id || null,
    projectId: s.project_id || null,
    customerName,
    title,
    cost,
    commission,
    summaryText,
  });

  // AUTO-MOVE: advance the linked project to offer-sent (forward only). Non-fatal if it fails —
  // the offer is already saved; we don't undo a good save over a status update.
  if (saved.ok && s.project_id) {
    const pr = await sb().from('projects').select('status').eq('id', s.project_id).maybeSingle();
    const current = pr.data?.status as string | undefined;
    if (!pr.error && current && ADVANCE_FROM.includes(current)) {
      const upd = await sb().from('projects')
        .update({ status: OFFER_SENT_STATUS, updated_at: new Date().toISOString() })
        .eq('id', s.project_id);
      if (!upd.error) {
        revalidatePath('/pipeline');
        revalidatePath('/roi');
        revalidatePath('/dashboard');
      } else {
        console.error('[createOfferFromEngine] status advance failed:', upd.error.message);
      }
    }
  }

  return saved;
}
