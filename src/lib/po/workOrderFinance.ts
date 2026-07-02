// src/lib/po/workOrderFinance.ts
// PLAIN module (no 'use server') — the MONEY MODEL for the Ales work order.
//
// SINGLE RESPONSIBILITY: given the line items + order amount + commission,
// compute the derived numbers shown on the document (total material, Ales profit,
// and the profit-share breakdown for the hero bar).
//
// THIS IS THE FILE THAT WILL CHANGE MOST as pricing evolves (tiered commission,
// discounts, per-line margin, VAT handling). Keeping all money logic HERE means the
// pages and the data types never have to change when the pricing rules do.

import type { WorkOrderLine, WorkOrderFinance, WorkOrderDraftInput } from './workOrderTypes';

// Sum the material cost across every line item (sinks + addons + doors alike).
export function totalMaterial(lines: WorkOrderLine[]): number {
  return lines.reduce((sum, l) => sum + (Number(l.materialIls) || 0), 0);
}

// Build the frozen finance snapshot from the finalize-panel input.
// Ales profit = order amount − total material − Marble Art commission.
export function buildFinance(input: WorkOrderDraftInput): WorkOrderFinance {
  const lineItems = input.lines || [];
  const totalMaterialIls = totalMaterial(lineItems);
  const orderAmountIls = Number(input.orderAmountIls) || 0;
  const commissionIls = Number(input.commissionIls) || 0;
  const alesProfitIls = orderAmountIls - totalMaterialIls - commissionIls;
  return {
    lineItems,
    orderAmountIls,
    commissionIls,
    totalMaterialIls,
    alesProfitIls,
    createdAtIso: new Date().toISOString(),
  };
}

// Recompute derived numbers live (used by the finalize panel preview, before saving).
// Same math as buildFinance but without freezing a timestamp — safe to call on every keystroke.
export function previewFinance(lines: WorkOrderLine[], orderAmountIls: number, commissionIls: number): {
  totalMaterialIls: number; alesProfitIls: number;
} {
  const mat = totalMaterial(lines);
  return {
    totalMaterialIls: mat,
    alesProfitIls: (Number(orderAmountIls) || 0) - mat - (Number(commissionIls) || 0),
  };
}

// The three slices for the hero profit-share bar, as percentages of the order amount.
// Guards against divide-by-zero and negative profit (clamps to 0 for the bar only —
// the real alesProfitIls number is shown as-is so a bad deal is still visible).
export interface ProfitShare {
  materialPct: number; commissionPct: number; profitPct: number;
  materialIls: number; commissionIls: number; profitIls: number; orderIls: number;
}
export function profitShare(fin: WorkOrderFinance): ProfitShare {
  const order = fin.orderAmountIls > 0 ? fin.orderAmountIls : 1;
  const pct = (n: number) => Math.max(0, Math.round((n / order) * 1000) / 10);
  return {
    materialPct: pct(fin.totalMaterialIls),
    commissionPct: pct(fin.commissionIls),
    profitPct: pct(fin.alesProfitIls),
    materialIls: fin.totalMaterialIls,
    commissionIls: fin.commissionIls,
    profitIls: fin.alesProfitIls,
    orderIls: fin.orderAmountIls,
  };
}

// Shekel formatter — single place so every page shows money identically.
export function ils(n: number): string {
  return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL');
}
