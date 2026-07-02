// src/lib/po/workOrderTypes.ts
// Shared type definitions for the multi-item Ales work order.
// PLAIN module (no 'use server') — types must live outside server-action files
// so they can be imported by both server actions and client components.
//
// DESIGN: a work order is a LIST of line items. Each item is a sink, an add-on,
// or a door (ZERO doors module). The finance model sums the lines — so adding a
// new item type, another sink, or a door never touches the profit math or the pages.

import type { MaterialResult } from '@/lib/offers/materialCalc';

// ---- Line item kinds -------------------------------------------------------
// Extending later = add a string here + a branch in the finance/page loops. Nothing else.
export type LineKind = 'sink' | 'addon' | 'door';

// A single line on the work order. Every kind carries a material cost (materialIls)
// so the finance model can sum uniformly regardless of kind.
export interface WorkOrderLine {
  kind: LineKind;
  label: string;              // Hebrew display label, e.g. "כיור 2.70 — נחום גולדמן"
  materialIls: number;        // material cost for THIS line (Trabelsi, pre-margin)

  // --- sink-only (from the sketch + material calc) ---
  sketchId?: string | null;   // source demo_trials sketch row
  sketchSvg?: string | null;  // frozen SVG snapshot for the print page
  cutList?: MaterialResult | null; // full 8-panel calc snapshot (sheets, m², leftover, panels)

  // --- door-only (ZERO doors module plugs in HERE) ---
  // When the doors module is ready, a door line is created by reading a door record
  // and filling these fields. The work order does not need to know how doors are
  // designed — only the finished label + material cost + (optional) its own drawing.
  doorId?: string | null;     // source door record id (from the doors module)
  doorSvg?: string | null;    // optional door drawing snapshot for the print page

  // --- addon-only ---
  note?: string | null;       // free text describing the add-on
}

// ---- The finance snapshot stored on production_orders.cut_list (jsonb) -----
// This is the single source of truth for the money shown on the Ales document.
// When pricing logic evolves (tiered commission, discounts, per-line margin),
// the SHAPE stays; only workOrderFinance.ts changes how the derived numbers compute.
export interface WorkOrderFinance {
  lineItems: WorkOrderLine[];
  orderAmountIls: number;     // what the customer pays (total order)
  commissionIls: number;      // Marble Art commission (Avshi's margin)

  // derived + frozen at creation (so the document never recomputes / drifts):
  totalMaterialIls: number;   // Σ line materialIls
  alesProfitIls: number;      // orderAmountIls − totalMaterialIls − commissionIls
  createdAtIso: string;       // when this snapshot was frozen
}

// Convenience: what the finalize panel collects before creating the work order.
export interface WorkOrderDraftInput {
  lines: WorkOrderLine[];
  orderAmountIls: number;
  commissionIls: number;
}
