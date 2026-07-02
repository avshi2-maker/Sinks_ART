// src/lib/pricing/alesCostTypes.ts
// PLAIN module (no 'use server') — shared shapes for the Ales cost + pricing engine.
// Types live outside server-action files so both server actions and client components can import them.
//
// The pricing engine turns a sketch into an offer through these stages:
//   material + labor + overhead + consumables -> trueCost
//   trueCost × (1 + commission%) -> baseOffer (XYZ)  [Avshi's transparent fee]
//   baseOffer + artPremium -> finalOffer (UVW)       [what the customer pays]
//   artPremium split (default 50/50) -> Avshi share + Ales bonus

// ---- The editable settings row (mirrors ales_cost_settings table) ----
export interface AlesCostSettings {
  id: number;
  // monthly fixed costs (each line editable — from Ales's real cost sheet)
  rentIls: number;
  electricWaterIls: number;
  vehicleIls: number;
  insuranceIls: number;
  accountantIls: number;
  foodDailyIls: number;
  miscIls: number;
  workdaysPerMonth: number;
  // labor day rates
  alesDayRateIls: number;
  yaroslavDayRateIls: number;
  // consumables per sink
  adhesivesIls: number;
  polishingIls: number;
  paintIls: number;
  // pricing
  commissionPct: number;      // fixed commission on true cost (default 15)
  premiumSplitPct: number;    // Avshi's share of the art premium (default 50)
}

// ---- What the pricing calc produces for one job ----
export interface PricingResult {
  // cost side
  materialIls: number;        // from the material calc (Trabelsi)
  laborIls: number;           // days × (ales + yaroslav day rates)
  overheadIls: number;        // days × (monthly fixed ÷ workdays)
  consumablesIls: number;     // adhesives + polishing + paint
  trueCostIls: number;        // sum of the four above

  // offer side
  commissionPct: number;
  commissionIls: number;      // trueCost × commission%
  baseOfferIls: number;       // trueCost + commission  (XYZ — Ales sees this)
  artPremiumIls: number;      // manual per-job add-on   (0 if none)
  finalOfferIls: number;      // baseOffer + premium     (UVW — customer pays)

  // premium split
  premiumSplitPct: number;    // Avshi's share %
  avshiPremiumShareIls: number;
  alesPremiumBonusIls: number;

  // what each party walks away with
  alesLaborIncomeIls: number; // guaranteed day-rate income (already in laborIls)
  alesTotalIls: number;       // labor income + premium bonus  (the BOOM number)
  avshiTotalIls: number;      // commission + premium share
}

// ---- The derived per-day overhead (computed, not stored) ----
export interface OverheadPerDay {
  monthlyFixedIls: number;    // sum of the 7 monthly lines
  workdaysPerMonth: number;
  perDayIls: number;          // monthlyFixed ÷ workdays  (~133)
}
