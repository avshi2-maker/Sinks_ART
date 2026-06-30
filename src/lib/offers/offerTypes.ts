// src/lib/offers/offerTypes.ts
// Plain shared types for the offer builder + price-breaks (kept out of 'use server' files).

export interface PriceBreakRow {
  id: string;
  label_he: string;
  price_ils: number;
  kind: string;      // 'base' | 'addon'
  sort_order: number;
}

export interface PriceBreakResult { ok: boolean; error?: string; id?: string }
