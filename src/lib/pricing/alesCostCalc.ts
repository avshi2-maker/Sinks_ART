// src/lib/pricing/alesCostCalc.ts
// PLAIN module (no 'use server') — THE PRICING BRAIN. Pure functions, importable anywhere.
//
// MODES: dayRate (bottom-up from settings) · lumpSum (Σ Ales's itemized turnkey lines).
// COMMISSION: default = settings %; per-job override as % OR fixed ₪ (Avshi quotes some jobs
// with a flat markup, e.g. Ziv 213 = lump 11,800 + flat 1,000 = 12,800).
// Both flow: trueCost + commission (XYZ) -> +artPremium (UVW) -> premium split.

import type { AlesCostSettings, PricingResult, OverheadPerDay, CostMode, LumpSumLine } from './alesCostTypes';

export function overheadPerDay(s: AlesCostSettings): OverheadPerDay {
  const monthlyFixedIls =
    s.rentIls + s.electricWaterIls + s.vehicleIls + s.insuranceIls +
    s.accountantIls + s.foodDailyIls + s.miscIls;
  const workdays = s.workdaysPerMonth > 0 ? s.workdaysPerMonth : 1;
  return { monthlyFixedIls, workdaysPerMonth: s.workdaysPerMonth, perDayIls: monthlyFixedIls / workdays };
}

export type CommissionMode = 'pct' | 'fixed';
export interface CommissionOverride { mode: CommissionMode; value: number; }

export interface PricingInput {
  costMode: CostMode;
  materialIls: number;
  days: number;
  lumpSumLines: LumpSumLine[];
  artPremiumIls: number;
  settings: AlesCostSettings;
  commission?: CommissionOverride;   // optional; default = settings.commissionPct as %
}

export function calcPricing(input: PricingInput): PricingResult {
  const s = input.settings;
  const premium = Number(input.artPremiumIls) || 0;
  const mode: CostMode = input.costMode === 'lumpSum' ? 'lumpSum' : 'dayRate';

  let materialIls = 0, laborIls = 0, overheadIls = 0, consumablesIls = 0;
  let trueCostIls = 0, alesLaborIncomeIls = 0;
  let lumpSumLines: LumpSumLine[] = [];

  if (mode === 'lumpSum') {
    lumpSumLines = (input.lumpSumLines || []).map((l) => ({ label: l.label, amountIls: Number(l.amountIls) || 0 }));
    trueCostIls = lumpSumLines.reduce((sum, l) => sum + l.amountIls, 0);
    alesLaborIncomeIls = trueCostIls;
  } else {
    const days = input.days > 0 ? input.days : 0;
    materialIls = Number(input.materialIls) || 0;
    laborIls = days * (s.alesDayRateIls + s.yaroslavDayRateIls);
    overheadIls = days * overheadPerDay(s).perDayIls;
    consumablesIls = s.adhesivesIls + s.polishingIls + s.paintIls;
    trueCostIls = materialIls + laborIls + overheadIls + consumablesIls;
    alesLaborIncomeIls = laborIls;
  }

  // Commission: per-job override (pct or fixed ₪) or settings default %.
  const ov = input.commission;
  let commissionIls: number;
  let commissionPct: number;
  if (ov && ov.mode === 'fixed') {
    commissionIls = Number(ov.value) || 0;
    commissionPct = trueCostIls > 0 ? Math.round((commissionIls / trueCostIls) * 1000) / 10 : 0; // derived, 1 decimal
  } else if (ov && ov.mode === 'pct') {
    commissionPct = Number(ov.value) || 0;
    commissionIls = trueCostIls * (commissionPct / 100);
  } else {
    commissionPct = s.commissionPct;
    commissionIls = trueCostIls * (commissionPct / 100);
  }

  const baseOfferIls = trueCostIls + commissionIls;
  const finalOfferIls = baseOfferIls + premium;

  const premiumSplitPct = s.premiumSplitPct;
  const avshiPremiumShareIls = premium * (premiumSplitPct / 100);
  const alesPremiumBonusIls = premium - avshiPremiumShareIls;

  const alesTotalIls = alesLaborIncomeIls + alesPremiumBonusIls;
  const avshiTotalIls = commissionIls + avshiPremiumShareIls;

  return {
    costMode: mode,
    lumpSumLines,
    materialIls, laborIls, overheadIls, consumablesIls, trueCostIls,
    commissionPct, commissionIls, baseOfferIls,
    artPremiumIls: premium, finalOfferIls,
    premiumSplitPct, avshiPremiumShareIls, alesPremiumBonusIls,
    alesLaborIncomeIls, alesTotalIls, avshiTotalIls,
  };
}
