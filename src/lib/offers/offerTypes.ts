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

// Offer builder save payload. commission = markup = your margin (-> ROI total_margin).
export interface SaveOfferInput {
  customerId?: string | null;
  projectId?: string | null;
  customerName?: string | null;
  title?: string;          // short label for the offer / quote line
  cost: number;            // base + components (Ales labor + materials)
  commission: number;      // your markup/commission -> total_margin
  summaryText?: string;    // the full itemized offer text (also used for copy)
}

export interface SaveOfferResult { ok: boolean; error?: string; quoteId?: string; quoteNumber?: string }
