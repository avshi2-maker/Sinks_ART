/**
 * src/lib/quotes/fetchQuotes.ts
 *
 * Server-side data fetchers for the Quote Engine.
 * Three functions:
 *   - fetchQuotes(opts)              — list of quote summaries (no lines)
 *   - fetchQuote(id)                  — one quote WITH lines
 *   - fetchCustomerQuotes(customerId) — quotes belonging to one customer
 *
 * All return plain serializable objects safe to pass from server components
 * to client components. No Supabase row metadata leaks through.
 *
 * Phase 27a — Quote Engine, Stage 1 (Session 22, 10/05/2026)
 */

import { createClient } from '@supabase/supabase-js';
import type { QuoteRow, QuoteLineRow, QuoteWithLines, QuoteStatus } from './types';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── fetchQuotes — list view ───────────────────────────────────────────

export interface FetchQuotesOptions {
  /** Filter by status. Omit for all statuses. */
  status?:   QuoteStatus | QuoteStatus[];
  /** Maximum rows to return. Default 100. */
  limit?:    number;
  /** Sort: 'created_desc' (newest first, default) or 'created_asc'. */
  sort?:     'created_desc' | 'created_asc';
}

export async function fetchQuotes(opts: FetchQuotesOptions = {}): Promise<QuoteRow[]> {
  const sb = getServerSupabase();
  const limit = opts.limit ?? 100;

  let q = sb.from('quotes').select('*');

  if (opts.status) {
    if (Array.isArray(opts.status)) {
      q = q.in('status', opts.status);
    } else {
      q = q.eq('status', opts.status);
    }
  }

  q = q.order('created_at', { ascending: opts.sort === 'created_asc' });
  q = q.limit(limit);

  const res = await q;
  if (res.error) {
    throw new Error('fetchQuotes failed: ' + res.error.message);
  }

  return (res.data || []) as QuoteRow[];
}

// ── fetchQuote — one quote with lines ─────────────────────────────────

export async function fetchQuote(id: string): Promise<QuoteWithLines | null> {
  if (!id) return null;
  const sb = getServerSupabase();

  // Two queries in parallel: header + lines
  const [headRes, linesRes] = await Promise.all([
    sb.from('quotes').select('*').eq('id', id).maybeSingle(),
    sb.from('quote_lines').select('*').eq('quote_id', id).order('line_number', { ascending: true }),
  ]);

  if (headRes.error) {
    throw new Error('fetchQuote (header) failed: ' + headRes.error.message);
  }
  if (linesRes.error) {
    throw new Error('fetchQuote (lines) failed: ' + linesRes.error.message);
  }

  if (!headRes.data) return null;  // quote not found

  const head = headRes.data as QuoteRow;
  const lines = (linesRes.data || []) as QuoteLineRow[];

  return { ...head, lines };
}

// ── fetchCustomerQuotes — all quotes for one customer ─────────────────

export async function fetchCustomerQuotes(customerId: string): Promise<QuoteRow[]> {
  if (!customerId) return [];
  const sb = getServerSupabase();

  const res = await sb
    .from('quotes')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (res.error) {
    throw new Error('fetchCustomerQuotes failed: ' + res.error.message);
  }

  return (res.data || []) as QuoteRow[];
}

// ── Quote number generator helper (used by createQuote in Stage 2) ────

/**
 * Returns the next available quote number for the current year, in the format
 * MARB-YYYY-NNN (zero-padded to 3 digits).
 *
 * Implementation: counts existing quotes for the current year + 1.
 * NOTE: not race-safe under high concurrency (two simultaneous creates could
 * both compute the same number). For marble's volume that's fine. If this ever
 * matters, swap to a Postgres sequence or RPC function.
 */
export async function nextQuoteNumber(): Promise<string> {
  const sb = getServerSupabase();
  const year = new Date().getFullYear();
  const prefix = `MARB-${year}-`;

  const res = await sb
    .from('quotes')
    .select('quote_number', { count: 'exact', head: false })
    .like('quote_number', prefix + '%');

  if (res.error) {
    throw new Error('nextQuoteNumber failed: ' + res.error.message);
  }

  // Find the highest existing suffix and add 1
  let maxN = 0;
  for (const row of (res.data || []) as { quote_number: string }[]) {
    const suffix = row.quote_number.slice(prefix.length);
    const n = parseInt(suffix, 10);
    if (!isNaN(n) && n > maxN) maxN = n;
  }

  return prefix + String(maxN + 1).padStart(3, '0');
}
