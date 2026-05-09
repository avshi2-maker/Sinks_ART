/**
 * src/lib/shared/fetchMonthCost.ts
 *
 * Server-side function that returns this month's total API cost from
 * customer_communications.api_cost_usd, plus a Hebrew month label.
 *
 * Used by TopNav's cost chip on /dashboard, /sinc, /intake, /customers/[id].
 *
 * Phase 18 — Top navigation bar (Session 21, 09/05/2026)
 */

import { createClient } from '@supabase/supabase-js';

export interface MonthCostResult {
  totalUsd:   number;
  monthLabel: string;  // e.g., "מאי 2026"
}

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Returns ISO timestamp for the start of the CURRENT MONTH in Asia/Jerusalem. */
function startOfMonthJerusalem(): string {
  const now = new Date();
  const jerusalemNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const startLocal = new Date(jerusalemNow.getFullYear(), jerusalemNow.getMonth(), 1, 0, 0, 0, 0);
  const tzOffsetMs = jerusalemNow.getTime() - now.getTime();
  return new Date(startLocal.getTime() - tzOffsetMs).toISOString();
}

/** Returns Hebrew month + year, e.g., "מאי 2026" */
function hebrewMonthLabel(): string {
  const now = new Date();
  const jerusalemNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  return `${HEBREW_MONTHS[jerusalemNow.getMonth()]} ${jerusalemNow.getFullYear()}`;
}

export async function fetchMonthCost(): Promise<MonthCostResult> {
  const sb = getServerSupabase();
  const monthStart = startOfMonthJerusalem();

  const res = await sb
    .from('customer_communications')
    .select('api_cost_usd')
    .gte('created_at', monthStart);

  if (res.error) {
    throw new Error('Month cost query failed: ' + res.error.message);
  }

  const totalUsd = (res.data || []).reduce(
    (sum: number, r: { api_cost_usd: number | null }) => sum + (Number(r.api_cost_usd) || 0),
    0,
  );

  return {
    totalUsd,
    monthLabel: hebrewMonthLabel(),
  };
}
