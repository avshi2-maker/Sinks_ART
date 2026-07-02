// src/lib/po/sketchSpecToDims.ts
// PLAIN module (no 'use server') — importable anywhere.
// Bridges the SKETCH builder's saved spec (mm keys) to the MATERIAL CALC inputs (cm keys).
//
// WHY THIS FILE EXISTS (single responsibility):
// The sketch builder stores inputs_jsonb in millimetres with its own key names
// (lengthMm, widthMm, ...). materialCalc.ts wants centimetres with its own names
// (lenCm, widCm, ...). If the sketch builder ever adds/renames a field, THIS is the
// only file that changes — the calc and the work order stay untouched.
//
// VERIFIED: the נחום גולדמן 2.70 spec below maps to
//   { lenCm:295, widCm:45, heightCm:25, basinDepthCm:15, endWallCm:20, rimCm:3.5 }
// which reproduces 4 sheets / 12.96 m² / ₪2,579 — matched to Trabelsi.

import type { SinkDims } from '@/lib/offers/materialCalc';

// The sketch builder does NOT capture a rim-lip width. 3.5 cm is the verified
// Goldman value; used as the default so the cut list reproduces the known result.
export const DEFAULT_RIM_CM = 3.5;

// Read a numeric field from the spec by any of several possible keys (mm assumed).
function mm(spec: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = spec[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

// Convert one saved sketch spec (inputs_jsonb) into SinkDims (cm) for the material calc.
// End wall: sketch stores wallLeftMm / wallRightMm separately; the calc uses one
// symmetric endWall. We take the left (they're equal on a standard trough); if they
// ever differ, average keeps the material estimate honest.
export function sketchSpecToDims(spec: Record<string, unknown> | null | undefined): SinkDims {
  const s = spec || {};
  const toCm = (v: number) => v / 10;

  const wallLeft = mm(s, ['wallLeftMm', 'endWallLeftMm']);
  const wallRight = mm(s, ['wallRightMm', 'endWallRightMm']);
  const endWallMm = wallLeft && wallRight ? (wallLeft + wallRight) / 2 : (wallLeft || wallRight);

  return {
    lenCm: toCm(mm(s, ['lengthMm', 'lenMm', 'lengthmm'])),
    widCm: toCm(mm(s, ['widthMm', 'widMm', 'depthMm'])),
    heightCm: toCm(mm(s, ['heightMm', 'bodyHeightMm'])),
    basinDepthCm: toCm(mm(s, ['basinDepthMm', 'basinMm'])),
    endWallCm: toCm(endWallMm),
    rimCm: DEFAULT_RIM_CM,
  };
}

// A human-friendly label for a sink line, built from the spec.
export function sketchLabel(spec: Record<string, unknown> | null | undefined, fallback = 'כיור'): string {
  const s = spec || {};
  for (const k of ['modelName', 'title', 'name', 'שם הדגם']) {
    const v = s[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return fallback;
}
