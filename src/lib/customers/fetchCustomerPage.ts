// src/lib/customers/fetchCustomerPage.ts
// Phase 16 — Single async fetcher returning all data needed for /customers/[id].
// Phase 19 — Now joins media_analyses by comm_id so photos/videos render inline.
// Server-only. Uses anon Supabase client (RLS = read open per current Phase 16 baseline).

import { createClient } from '@supabase/supabase-js';
import type { CustomerPageData, CommunicationRow, MediaAnalysisRow } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function fetchCustomerPage(customerId: string): Promise<CustomerPageData | null> {
  // Four parallel queries: customer, projects, comms, media_analyses for this customer
  const [
    { data: customer, error: cErr },
    { data: projects, error: pErr },
    { data: comms,    error: kErr },
    { data: medias,   error: mErr },
  ] = await Promise.all([
    supabase.from('customers').select('*').eq('id', customerId).single(),
    supabase
      .from('projects')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('customer_communications')
      .select('*')
      .eq('customer_id', customerId)
      .order('occurred_at', { ascending: false }),
    supabase
      .from('media_analyses')
      .select('*')
      .eq('customer_id', customerId),
  ]);

  if (cErr || !customer) return null;
  if (pErr) console.error('[fetchCustomerPage] projects fetch error:', pErr.message);
  if (kErr) console.error('[fetchCustomerPage] comms fetch error:', kErr.message);
  if (mErr) console.error('[fetchCustomerPage] media_analyses fetch error:', mErr.message);

  // Build a lookup map: comm_id -> MediaAnalysisRow
  // (one comm can have at most one analysis row per current /intake design)
  const mediaByCommId = new Map<string, MediaAnalysisRow>();
  for (const m of (medias as MediaAnalysisRow[] | null) || []) {
    mediaByCommId.set(m.comm_id, m);
  }

  // Attach media_analysis to each comm row
  const commsWithMedia: CommunicationRow[] = ((comms as CommunicationRow[] | null) || []).map((c) => ({
    ...c,
    media_analysis: mediaByCommId.get(c.id) ?? null,
  }));

  return {
    customer,
    projects: projects ?? [],
    comms: commsWithMedia,
  };
}
