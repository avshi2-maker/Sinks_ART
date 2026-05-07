// src/lib/customers/fetchCustomerPage.ts
// Phase 16 — Single async fetcher returning all data needed for /customers/[id].
// Server-only. Uses anon Supabase client (RLS = read open per current Phase 16 baseline).

import { createClient } from '@supabase/supabase-js';
import type { CustomerPageData } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function fetchCustomerPage(customerId: string): Promise<CustomerPageData | null> {
  const [
    { data: customer, error: cErr },
    { data: projects, error: pErr },
    { data: comms, error: kErr },
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
  ]);

  if (cErr || !customer) {
    if (cErr) console.error('[fetchCustomerPage] customer error:', cErr.message);
    return null;
  }
  if (pErr) console.error('[fetchCustomerPage] projects error:', pErr.message);
  if (kErr) console.error('[fetchCustomerPage] comms error:', kErr.message);

  return {
    customer,
    projects: projects ?? [],
    comms: comms ?? [],
  };
}
