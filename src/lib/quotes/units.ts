/**
 * src/lib/quotes/units.ts
 *
 * Helpers for working with the 9 Hebrew quote units.
 * Pure functions, no React, no Supabase — safe to import anywhere.
 *
 * Phase 27a — Quote Engine, Stage 1 (Session 22, 10/05/2026)
 * Phase 27  — Cost/margin extension (07/06/2026): computeQuoteTotals now also
 *             returns `cost` and `margin`. Backward compatible.
 */

import type { QuoteUnit } from './types';

export function formatQuantityWithUnit(quantity: number, unit: QuoteUnit): string {
  const q = Number.isInteger(quantity) ? String(quantity) : String(parseFloat(quantity.toFixed(3)));
  return `${q} ${unit}`;
}

export function isCountUnit(unit: QuoteUnit): boolean {
  return unit === "יח'" || unit === 'ס"ע' || unit === 'פאושלי';
}

export function quantityDecimals(unit: QuoteUnit): number {
  if (isCountUnit(unit)) return 0;
  if (unit === 'שעות')   return 1;
  return 2;
}

export function formatIlsAmount(amount: number): string {
  return '₪ ' + amount.toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Compute totals from line items. VAT applies per-line.
 *   subtotal — sum of line_totals (qty × unit_cost = CUSTOMER price), pre-VAT
 *   vatAmount — VAT only on lines where vat_applies is true
 *   grand — subtotal + vatAmount (what the customer pays)
 *   cost — sum of (qty × supplier_cost) = INTERNAL cost
 *   margin — subtotal − cost (gross margin, pre-VAT)
 * supplier_cost is optional; omitted counts as 0, so old callers still work.
 */
export function computeQuoteTotals(
  lines: { quantity: number; unit_cost: number; vat_applies: boolean; supplier_cost?: number }[],
  vatRate: number = 0.18,
): { subtotal: number; vatAmount: number; grand: number; cost: number; margin: number } {
  let subtotal = 0;
  let vatableSubtotal = 0;
  let cost = 0;
  for (const line of lines) {
    const lineTotal = line.quantity * line.unit_cost;
    subtotal += lineTotal;
    if (line.vat_applies) vatableSubtotal += lineTotal;
    cost += line.quantity * (line.supplier_cost ?? 0);
  }
  const vatAmount = vatableSubtotal * vatRate;
  return {
    subtotal: round2(subtotal),
    vatAmount: round2(vatAmount),
    grand:    round2(subtotal + vatAmount),
    cost:     round2(cost),
    margin:   round2(subtotal - cost),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
