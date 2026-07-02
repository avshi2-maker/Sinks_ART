'use server';

// src/lib/pricing/alesCostData.ts
// Read + save the single-row Ales cost settings (mirrors ales_cost_settings table).
// Maps snake_case DB columns <-> camelCase AlesCostSettings shape. One row, id = 1.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { AlesCostSettings } from './alesCostTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Fallback defaults — mirror the table seed, used if the row can't be read.
const DEFAULTS: AlesCostSettings = {
  id: 1,
  rentIls: 700, electricWaterIls: 300, vehicleIls: 1000, insuranceIls: 250,
  accountantIls: 300, foodDailyIls: 150, miscIls: 500, workdaysPerMonth: 24,
  alesDayRateIls: 1500, yaroslavDayRateIls: 1500,
  adhesivesIls: 30, polishingIls: 50, paintIls: 10,
  commissionPct: 15, premiumSplitPct: 50,
};

type Row = Record<string, unknown>;
const num = (v: unknown, d: number): number => {
  const n = Number(v);
  return isNaN(n) ? d : n;
};

function rowToSettings(r: Row): AlesCostSettings {
  return {
    id: 1,
    rentIls: num(r.rent_ils, DEFAULTS.rentIls),
    electricWaterIls: num(r.electric_water_ils, DEFAULTS.electricWaterIls),
    vehicleIls: num(r.vehicle_ils, DEFAULTS.vehicleIls),
    insuranceIls: num(r.insurance_ils, DEFAULTS.insuranceIls),
    accountantIls: num(r.accountant_ils, DEFAULTS.accountantIls),
    foodDailyIls: num(r.food_daily_ils, DEFAULTS.foodDailyIls),
    miscIls: num(r.misc_ils, DEFAULTS.miscIls),
    workdaysPerMonth: num(r.workdays_per_month, DEFAULTS.workdaysPerMonth),
    alesDayRateIls: num(r.ales_day_rate_ils, DEFAULTS.alesDayRateIls),
    yaroslavDayRateIls: num(r.yaroslav_day_rate_ils, DEFAULTS.yaroslavDayRateIls),
    adhesivesIls: num(r.adhesives_ils, DEFAULTS.adhesivesIls),
    polishingIls: num(r.polishing_ils, DEFAULTS.polishingIls),
    paintIls: num(r.paint_ils, DEFAULTS.paintIls),
    commissionPct: num(r.commission_pct, DEFAULTS.commissionPct),
    premiumSplitPct: num(r.premium_split_pct, DEFAULTS.premiumSplitPct),
  };
}

export async function fetchAlesCostSettings(): Promise<AlesCostSettings> {
  const res = await sb().from('ales_cost_settings').select('*').eq('id', 1).maybeSingle();
  if (res.error || !res.data) { console.error('[fetchAlesCostSettings]', res.error?.message); return DEFAULTS; }
  return rowToSettings(res.data as Row);
}

export interface SaveResult { ok: boolean; error?: string; }

export async function updateAlesCostSettings(s: AlesCostSettings): Promise<SaveResult> {
  const res = await sb().from('ales_cost_settings').update({
    rent_ils: s.rentIls,
    electric_water_ils: s.electricWaterIls,
    vehicle_ils: s.vehicleIls,
    insurance_ils: s.insuranceIls,
    accountant_ils: s.accountantIls,
    food_daily_ils: s.foodDailyIls,
    misc_ils: s.miscIls,
    workdays_per_month: s.workdaysPerMonth,
    ales_day_rate_ils: s.alesDayRateIls,
    yaroslav_day_rate_ils: s.yaroslavDayRateIls,
    adhesives_ils: s.adhesivesIls,
    polishing_ils: s.polishingIls,
    paint_ils: s.paintIls,
    commission_pct: s.commissionPct,
    premium_split_pct: s.premiumSplitPct,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/ales-settings');
  return { ok: true };
}
