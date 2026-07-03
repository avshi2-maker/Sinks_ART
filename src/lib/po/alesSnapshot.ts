// src/lib/po/alesSnapshot.ts
// PLAIN module (no 'use server') — safely read the frozen Ales work-order snapshot off a PO.
// The 3-page Ales document renders entirely from this; this helper guards against old
// pre-engine work orders (which have a different / missing cut_list shape).

import type { ProductionOrder } from './poData';
import type { AlesWorkOrderSnapshot } from './createWorkOrderFromSketch';

// Returns the v2 snapshot if this PO was created by the pricing engine, else null.
export function readAlesSnapshot(po: ProductionOrder): AlesWorkOrderSnapshot | null {
  const raw = po.cut_list as unknown;
  if (!raw || typeof raw !== 'object') return null;
  const snap = raw as Partial<AlesWorkOrderSnapshot>;
  // v2 marker + the two blocks the pages need
  if (snap.version === 2 && snap.pricing && snap.cutList) {
    return snap as AlesWorkOrderSnapshot;
  }
  return null;
}

// Shekel + m² formatters — shared by all three Ales pages so numbers read identically.
export function ils(n: number): string {
  return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL');
}
export function m2(n: number): string {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2) + ' מ"ר';
}
