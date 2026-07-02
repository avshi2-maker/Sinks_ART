// src/lib/pricing/alesCostCalc.ts
// PLAIN module (no 'use server') — THE PRICING BRAIN. Pure functions, importable anywhere.
//
// Chain:
//   overhead/day = (sum of 7 monthly fixed lines) ÷ workdays        (~₪133)
//   labor        = days × (Ales rate + Yaroslav rate)
//   overhead     = days × overhead/day
//   consumables  = adhesives + polishing + paint
//   trueCost     = material + labor + overhead + consumables
//   baseOffer    = trueCost + trueCost × commission%                (XYZ — Ales sees it)
//   finalOffer   = baseOffer + artPremium                           (UVW — customer pays)
//   premium split (default 50/50): Avshi share + Ales bonus
//
// This is where pricing rules live. Change the model here; the UI + document never change.

import type { AlesCostSettings, PricingResult, OverheadPerDay } from './alesCostTypes';

// Sum the 7 monthly fixed lines and divide by workdays → overhead per working day.
export function overheadPerDay(s: AlesCostSettings): OverheadPerDay {
  const monthlyFixedIls =
    s.rentIls + s.electricWaterIls + s.vehicleIls + s.insuranceIls +
    s.accountantIls + s.foodDailyIls + s.miscIls;
  const workdays = s.workdaysPerMonth > 0 ? s.workdaysPerMonth : 1;
  return {
    monthlyFixedIls,
    workdaysPerMonth: s.workdaysPerMonth,
    perDayIls: monthlyFixedIls / workdays,
  };
}

export interface PricingInput {
  materialIls: number;   // from the material calc (Trabelsi)
  days: number;          // days-per-sink (manual for now; Ales formula later)
  artPremiumIls: number; // per-job art add-on (0 if none)
  settings: AlesCostSettings;
}

export function calcPricing(input: PricingInput): PricingResult {
  const s = input.settings;
  const days = input.days > 0 ? input.days : 0;
  const material = Number(input.materialIls) || 0;
  const premium = Number(input.artPremiumIls) || 0;

  const laborIls = days * (s.alesDayRateIls + s.yaroslavDayRateIls);
  const overheadIls = days * overheadPerDay(s).perDayIls;
  const consumablesIls = s.adhesivesIls + s.polishingIls + s.paintIls;
  const trueCostIls = material + laborIls + overheadIls + consumablesIls;

  const commissionPct = s.commissionPct;
  const commissionIls = trueCostIls * (commissionPct / 100);
  const baseOfferIls = trueCostIls + commissionIls;          // XYZ
  const finalOfferIls = baseOfferIls + premium;              // UVW

  const premiumSplitPct = s.premiumSplitPct;                 // Avshi's share of premium
  const avshiPremiumShareIls = premium * (premiumSplitPct / 100);
  const alesPremiumBonusIls = premium - avshiPremiumShareIls;

  const alesLaborIncomeIls = laborIls;                       // guaranteed day-rate income
  const alesTotalIls = alesLaborIncomeIls + alesPremiumBonusIls;   // the BOOM number
  const avshiTotalIls = commissionIls + avshiPremiumShareIls;

  return {
    materialIls: material,
    laborIls,
    overheadIls,
    consumablesIls,
    trueCostIls,
    commissionPct,
    commissionIls,
    baseOfferIls,
    artPremiumIls: premium,
    finalOfferIls,
    premiumSplitPct,
    avshiPremiumShareIls,
    alesPremiumBonusIls,
    alesLaborIncomeIls,
    alesTotalIls,
    avshiTotalIls,
  };
}
