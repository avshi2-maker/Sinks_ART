// src/lib/pricing/alesCostTypes.ts
// PLAIN module (no 'use server') — shared shapes for the Ales cost + pricing engine.
//
// TWO COST MODES (Avshi ↔ Ales pricing methods, toggle per job):
//   'dayRate' — bottom-up: days × (rates) + overhead + consumables + material (settings-driven).
//   'lumpSum' — top-down: Ales quotes ONE turnkey price as ITEMIZED lines (labor+utilities, siphon,
//               wall assembly, trailer, Trabelsi material...). Sum = his price incl. his profit.
// Both then flow identically: trueCost × (1+15%) -> baseOffer -> +artPremium -> finalOffer -> split.

// ---- The editable settings row (mirrors ales_cost_settings table) ----
export interface AlesCostSettings {
  id: number;
  rentIls: number;
  electricWaterIls: number;
  vehicleIls: number;
  insuranceIls: number;
  accountantIls: number;
  foodDailyIls: number;
  miscIls: number;
  workdaysPerMonth: number;
  alesDayRateIls: number;
  yaroslavDayRateIls: number;
  adhesivesIls: number;
  polishingIls: number;
  paintIls: number;
  commissionPct: number;      // fixed commission on true cost (default 15)
  premiumSplitPct: number;    // Avshi's share of the art premium (default 50)
}

// ---- Cost mode ----
export type CostMode = 'dayRate' | 'lumpSum';

// One itemized line of Ales's lump-sum quote (full transparency, like Avshi's xlsx).
export interface LumpSumLine {
  label: string;   // Hebrew label, e.g. "עבודה + תקורה", "סיפון", "הרכבה על קיר", "הובלה לת\"א", "טרבלסי — חומר"
  amountIls: number;
}

// ---- What the pricing calc produces for one job ----
export interface PricingResult {
  // mode + lump detail (lumpSum mode only; empty in dayRate mode)
  costMode: CostMode;
  lumpSumLines: LumpSumLine[];

  // cost side (dayRate mode fills labor/overhead/consumables; lumpSum mode zeroes them
  // and materialIls holds only what's inside the lump lines if separately known — see calc)
  materialIls: number;
  laborIls: number;
  overheadIls: number;
  consumablesIls: number;
  trueCostIls: number;        // dayRate: sum of parts · lumpSum: Σ lump lines (Ales's turnkey price)

  // offer side
  commissionPct: number;
  commissionIls: number;      // trueCost × commission%
  baseOfferIls: number;       // trueCost + commission  (XYZ — Ales sees this)
  artPremiumIls: number;      // manual per-job add-on   (0 if none)
  finalOfferIls: number;      // baseOffer + premium     (UVW — customer pays)

  // premium split
  premiumSplitPct: number;
  avshiPremiumShareIls: number;
  alesPremiumBonusIls: number;

  // what each party walks away with
  alesLaborIncomeIls: number; // dayRate: labor income · lumpSum: his full lump (incl. his profit)
  alesTotalIls: number;       // above + premium bonus  (the BOOM number)
  avshiTotalIls: number;      // commission + premium share
}

// ---- The derived per-day overhead (computed, not stored) ----
export interface OverheadPerDay {
  monthlyFixedIls: number;
  workdaysPerMonth: number;
  perDayIls: number;
}

// Default lump-sum line labels — prefill from Avshi's real Ziv xlsx categories (amounts empty).
export const DEFAULT_LUMP_LINES: LumpSumLine[] = [
  { label: 'עבודה + תקורה (אלס)', amountIls: 0 },
  { label: 'סיפון', amountIls: 0 },
  { label: 'הרכבה על קיר', amountIls: 0 },
  { label: 'הובלה (טריילר) לת"א', amountIls: 0 },
  { label: 'טרבלסי — חומר', amountIls: 0 },
  { label: 'טרבלסי — אריזת עץ', amountIls: 0 },
  { label: 'טרבלסי — הובלה', amountIls: 0 },
];
