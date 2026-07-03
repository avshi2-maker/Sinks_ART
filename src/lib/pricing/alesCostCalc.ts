// src/lib/pricing/alesCostCalc.ts
// PLAIN module (no 'use server') — THE PRICING BRAIN. Pure functions, importable anywhere.
//
// TWO MODES:
// dayRate:  overhead/day = monthly fixed ÷ workdays · labor = days × rates
//           trueCost = material + labor + overhead + consumables
// lumpSum:  trueCost = Σ Ales's itemized lump lines (his turnkey price incl. his profit)
//           labor/overhead/consumables not broken out (inside his lump)
// Both:     baseOffer = trueCost × (1 + commission%)   (XYZ — transparent to Ales)
//           finalOffer = baseOffer + artPremium        (UVW — customer pays)
//           premium split (default 50/50): Avshi share + Ales bonus
//
// This is where pricing rules live. Change the model here; the UI + document never change.

import type { AlesCostSettings, PricingResult, OverheadPerDay, CostMode, LumpSumLine } from './alesCostTypes';

export function overheadPerDay(s: AlesCostSettings): OverheadPerDay {
  const monthlyFixedIls =
    s.rentIls + s.electricWaterIls + s.vehicleIls + s.insuranceIls +
    s.accountantIls + s.foodDailyIls + s.miscIls;
  const workdays = s.workdaysPerMonth > 0 ? s.workdaysPerMonth : 1;
  return { monthlyFixedIls, workdaysPerMonth: s.workdaysPerMonth, perDayIls: monthlyFixedIls / workdays };
}

export interface PricingInput {
  costMode: CostMode;
  // dayRate mode inputs:
  materialIls: number;        // from the material calc (Trabelsi)
  days: number;               // days-per-sink (manual)
  // lumpSum mode inputs:
  lumpSumLines: LumpSumLine[]; // Ales's itemized turnkey quote
  // both:
  artPremiumIls: number;
  settings: AlesCostSettings;
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
    alesLaborIncomeIls = trueCostIls;   // his whole lump = his income (incl. his profit)
  } else {
    const days = input.days > 0 ? input.days : 0;
    materialIls = Number(input.materialIls) || 0;
    laborIls = days * (s.alesDayRateIls + s.yaroslavDayRateIls);
    overheadIls = days * overheadPerDay(s).perDayIls;
    consumablesIls = s.adhesivesIls + s.polishingIls + s.paintIls;
    trueCostIls = materialIls + laborIls + overheadIls + consumablesIls;
    alesLaborIncomeIls = laborIls;
  }

  const commissionPct = s.commissionPct;
  const commissionIls = trueCostIls * (commissionPct / 100);
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
