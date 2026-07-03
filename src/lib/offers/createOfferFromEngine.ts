'use server';

// src/lib/offers/createOfferFromEngine.ts
// Bridge: pricing engine result -> existing saveOffer() -> quotes / offers-sent / ROI.
// Reuses the existing offer plumbing (no duplicate system). The customer offer carries only
// the CLEAN final price (UVW); cost breakdown + premium split are NOT exposed to the customer.
//
// ROI margin (total_margin) = Avshi's FULL take = 15% commission + his premium share (avshiTotalIls).

import { createClient } from '@supabase/supabase-js';
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

export interface CreateOfferFromEngineInput {
  sketchId: string;
  pricing: PricingResult;
}

export async function createOfferFromEngine(input: CreateOfferFromEngineInput): Promise<SaveOfferResult> {
  const { sketchId, pricing } = input;
  if (!sketchId) return { ok: false, error: 'missing sketchId' };
  if (!pricing) return { ok: false, error: 'missing pricing' };

  // read the sketch for label + customer/project links + customer name
  const res = await sb()
    .from('demo_trials')
    .select('title_he, customer_id, project_id')
    .eq('id', sketchId).eq('kind', 'sketch').maybeSingle();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'sketch not found' };
  const s = res.data;

  // resolve customer name (for the quote header) if linked
  let customerName: string | null = null;
  if (s.customer_id) {
    const cr = await sb().from('customers').select('name_he').eq('id', s.customer_id).maybeSingle();
    if (!cr.error && cr.data) customerName = (cr.data.name_he as string) || null;
  }

  const title = (s.title_he && String(s.title_he).trim()) || 'כיור אמנותי';

  // Map engine -> saveOffer:
  //   grand (customer price) = finalOfferIls
  //   commission (-> ROI total_margin) = avshiTotalIls  (15% + premium share = Avshi's full take)
  //   cost = grand - commission  (material + labor + Ales bonus — everything that isn't Avshi's margin)
  const grand = Math.round(pricing.finalOfferIls);
  const commission = Math.round(pricing.avshiTotalIls);
  const cost = grand - commission;

  // CLEAN customer-facing summary — final price only, no cost breakdown, no split.
  const summaryText = [
    'הצעת מחיר · ' + title,
    'כיור אמנותי בעבודת יד — פורצלן בלמינציה כפולה, גימור אומנותי.',
    '',
    'מחיר סופי: ' + ils(grand) + ' (כולל מע"מ)',
  ].join('\n');

  return saveOffer({
    customerId: s.customer_id || null,
    projectId: s.project_id || null,
    customerName,
    title,
    cost,
    commission,
    summaryText,
  });
}
