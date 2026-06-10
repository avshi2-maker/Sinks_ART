'use server';

// src/lib/roi/roiData.ts
// Phase 40 — ROI dashboard metrics. READ-ONLY. Money from quotes, pipeline from projects, funnel from leads.

import { createClient } from '@supabase/supabase-js';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface StatusBucket { status: string; count: number; value: number; }
export interface RoiMetrics {
  customers: number;
  projects: number;
  leadsTotal: number;
  leadsConverted: number;
  leadConversionPct: number;
  quotesTotal: number;
  quotesSent: number;
  revenueQuoted: number;   // sum of total_grand across all quotes
  totalCost: number;       // sum of total_cost
  totalMargin: number;     // sum of total_margin
  avgMarginPct: number;    // margin / grand
  pipeline: StatusBucket[];
}

export async function fetchRoiMetrics(): Promise<RoiMetrics> {
  const sb = getServerSupabase();

  const [custRes, projRes, leadRes, quoteRes] = await Promise.all([
    sb.from('customers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    sb.from('projects').select('status, quoted_price_ils'),
    sb.from('leads').select('id, converted_to_customer_id, is_archived'),
    sb.from('quotes').select('status, total_grand, total_cost, total_margin'),
  ]);

  const projects = (projRes.data || []) as { status: string | null; quoted_price_ils: number | null }[];
  const leads = (leadRes.data || []) as { converted_to_customer_id: string | null; is_archived: boolean | null }[];
  const quotes = (quoteRes.data || []) as { status: string | null; total_grand: number | null; total_cost: number | null; total_margin: number | null }[];

  // pipeline buckets
  const pipeMap = new Map<string, { count: number; value: number }>();
  for (const p of projects) {
    const s = p.status || 'ללא סטטוס';
    const cur = pipeMap.get(s) || { count: 0, value: 0 };
    cur.count += 1;
    cur.value += Number(p.quoted_price_ils) || 0;
    pipeMap.set(s, cur);
  }
  const pipeline: StatusBucket[] = Array.from(pipeMap.entries()).map(([status, v]) => ({ status, count: v.count, value: v.value })).sort((a, b) => b.count - a.count);

  // leads
  const activeLeads = leads.filter((l) => !l.is_archived);
  const leadsTotal = activeLeads.length;
  const leadsConverted = leads.filter((l) => l.converted_to_customer_id).length;

  // quotes money
  const revenueQuoted = quotes.reduce((s, q) => s + (Number(q.total_grand) || 0), 0);
  const totalCost = quotes.reduce((s, q) => s + (Number(q.total_cost) || 0), 0);
  const totalMargin = quotes.reduce((s, q) => s + (Number(q.total_margin) || 0), 0);
  const quotesSent = quotes.filter((q) => q.status === 'sent').length;

  return {
    customers: custRes.count || 0,
    projects: projects.length,
    leadsTotal,
    leadsConverted,
    leadConversionPct: leadsTotal > 0 ? Math.round((leadsConverted / (leadsTotal + leadsConverted)) * 100) : 0,
    quotesTotal: quotes.length,
    quotesSent,
    revenueQuoted,
    totalCost,
    totalMargin,
    avgMarginPct: revenueQuoted > 0 ? Math.round((totalMargin / revenueQuoted) * 100) : 0,
    pipeline,
  };
}
