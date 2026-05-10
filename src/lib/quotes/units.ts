/**
 * src/lib/quotes/units.ts
 *
 * Helpers for working with the 9 Hebrew quote units.
 * Pure functions, no React, no Supabase — safe to import anywhere.
 *
 * Phase 27a — Quote Engine, Stage 1 (Session 22, 10/05/2026)
 */

import type { QuoteUnit } from './types';

/** Format a quantity + unit for display, e.g., "3 יח'" or "12.5 מ"ר". */
export function formatQuantityWithUnit(quantity: number, unit: QuoteUnit): string {
  // Drop trailing zeros: 3.000 -> 3, 2.500 -> 2.5
  const q = Number.isInteger(quantity) ? String(quantity) : String(parseFloat(quantity.toFixed(3)));
  return `${q} ${unit}`;
}

/**
 * Is this unit a "count" (whole-numbers expected) or a "measurement" (decimals OK)?
 * Used to decide which input mode to show: integer stepper vs. decimal field.
 */
export function isCountUnit(unit: QuoteUnit): boolean {
  return unit === "יח'" || unit === 'ס"ע' || unit === 'פאושלי';
}

/**
 * Recommended decimal places for displaying quantity per unit type.
 *   - count units: 0 decimals (whole pieces)
 *   - hours: 1 decimal (e.g., 4.5 hours)
 *   - measurements (m, m², m³, kg, ton): 2 decimals
 */
export function quantityDecimals(unit: QuoteUnit): number {
  if (isCountUnit(unit)) return 0;
  if (unit === 'שעות')   return 1;
  return 2;
}

/** Format ILS amount: 5310 → "₪ 5,310.00". Hebrew thousand-separator locale. */
export function formatIlsAmount(amount: number): string {
  return '₪ ' + amount.toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Compute totals from an array of line items.
 * VAT applies per-line: each line can independently include or exclude VAT.
 *
 * Returns:
 *   subtotal  — sum of all line_totals (qty × unit_cost), regardless of VAT toggle
 *   vatAmount — VAT computed only on lines where vat_applies is true
 *   grand     — subtotal + vatAmount
 *
 * Using same shape that quotes table caches in total_subtotal / total_vat / total_grand.
 */
export function computeQuoteTotals(
  lines: { quantity: number; unit_cost: number; vat_applies: boolean }[],
  vatRate: number = 0.18,
): { subtotal: number; vatAmount: number; grand: number } {
  let subtotal = 0;
  let vatableSubtotal = 0;
  for (const line of lines) {
    const lineTotal = line.quantity * line.unit_cost;
    subtotal += lineTotal;
    if (line.vat_applies) vatableSubtotal += lineTotal;
  }
  const vatAmount = vatableSubtotal * vatRate;
  return {
    subtotal: round2(subtotal),
    vatAmount: round2(vatAmount),
    grand:    round2(subtotal + vatAmount),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
