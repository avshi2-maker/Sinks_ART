// src/lib/offers/materialCalc.ts
// Pure material-quantity logic for a wall-hung porcelain trough sink.
// Cracks the 3D sink into 8 flat panels (from the נחום גולדמן sketch model),
// sums deployed area, ×lamination, +waste/miter/slope, → m² needed → sheets → cost.
// No 'use server' — pure functions, importable anywhere.

export interface SinkDims {
  lenCm: number;      // אורך כולל — overall length (e.g. 295)
  widCm: number;      // רוחב — depth front-to-back (e.g. 45)
  heightCm: number;   // גובה חזית — body height (e.g. 25)
  basinDepthCm: number; // עומק אגן — inner basin depth (e.g. 15)
  endWallCm: number;  // דופן קצה each side (e.g. 20)
  rimCm: number;      // top rim lip width around opening (e.g. 3.5)
}

export interface MaterialFactors {
  laminate: boolean;  // ×2 — Ales laminates all parts (12mm)
  wastePct: number;   // saw waste
  miterPct: number;   // 45° seam allowance
  slopePct: number;   // slope adds area
}

export interface MaterialSettings {
  sheetLenCm: number; sheetWidCm: number;
  pricePerM2: number; crateIls: number; deliveryIls: number; vatPct: number;
}

export interface Panel { label: string; calc: string; m2: number; }

export interface MaterialResult {
  panels: Panel[];
  deployedM2: number;     // single layer
  laminatedM2: number;    // × lamination
  neededM2: number;       // + waste/miter/slope
  sheetM2: number;        // area of one sheet
  sheets: number;         // rounded UP
  purchasedM2: number;    // sheets × sheetM2
  leftoverM2: number;     // purchased − needed
  materialIls: number;    // purchased × price/m²
  crateIls: number;
  deliveryIls: number;
  preVatIls: number;
  vatIls: number;
  totalIls: number;       // material cost incl VAT
}

// The 8-panel flat deployment of a wall-hung trough (all four outer walls full height,
// solid front + back, top rim lip, two end caps, sloped basin floor, inner basin walls).
export function deployPanels(d: SinkDims): Panel[] {
  const basinLenCm = d.lenCm - 2 * d.endWallCm;      // 295 - 40 = 255
  const basinWidCm = Math.max(d.widCm - 2 * d.rimCm, 0); // opening width inside rim
  const cm2 = (a: number) => a / 10000;              // cm² → m²
  return [
    { label: 'תחתית אגן (משופעת)', calc: `${basinLenCm}×${d.widCm}`, m2: cm2(basinLenCm * d.widCm) },
    { label: 'חזית', calc: `${d.lenCm}×${d.heightCm}`, m2: cm2(d.lenCm * d.heightCm) },
    { label: 'גב (מלא)', calc: `${d.lenCm}×${d.heightCm}`, m2: cm2(d.lenCm * d.heightCm) },
    { label: 'שפת מסגרת עליונה', calc: `היקף ~${d.rimCm}`, m2: cm2(2 * d.lenCm * d.rimCm + 2 * basinWidCm * d.rimCm) },
    { label: 'פאה שמאל', calc: `${d.widCm}×${d.heightCm}`, m2: cm2(d.widCm * d.heightCm) },
    { label: 'פאה ימין', calc: `${d.widCm}×${d.heightCm}`, m2: cm2(d.widCm * d.heightCm) },
    { label: 'דפנות אגן אורך ×2', calc: `2×(${basinLenCm}×${d.basinDepthCm})`, m2: cm2(2 * basinLenCm * d.basinDepthCm) },
    { label: 'דפנות אגן קצה ×2', calc: `2×(${basinWidCm}×${d.basinDepthCm})`, m2: cm2(2 * basinWidCm * d.basinDepthCm) },
  ];
}

export function calcMaterial(d: SinkDims, f: MaterialFactors, s: MaterialSettings): MaterialResult {
  const panels = deployPanels(d);
  const deployedM2 = panels.reduce((sum, p) => sum + p.m2, 0);
  const laminatedM2 = deployedM2 * (f.laminate ? 2 : 1);
  const neededM2 = laminatedM2 * (1 + f.wastePct / 100) * (1 + f.miterPct / 100) * (1 + f.slopePct / 100);

  const sheetM2 = (s.sheetLenCm * s.sheetWidCm) / 10000;
  const sheets = Math.max(1, Math.ceil(neededM2 / sheetM2));
  const purchasedM2 = sheets * sheetM2;
  const leftoverM2 = purchasedM2 - neededM2;

  const materialIls = purchasedM2 * s.pricePerM2;
  const preVatIls = materialIls + s.crateIls + s.deliveryIls;
  const vatIls = preVatIls * (s.vatPct / 100);
  const totalIls = preVatIls + vatIls;

  return {
    panels, deployedM2, laminatedM2, neededM2, sheetM2, sheets, purchasedM2, leftoverM2,
    materialIls, crateIls: s.crateIls, deliveryIls: s.deliveryIls, preVatIls, vatIls, totalIls,
  };
}
