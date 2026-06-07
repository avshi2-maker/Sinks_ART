// src/lib/customers/fetchCustomersList.ts
// Phase 19 Stage B — Server-side fetcher for the /customers index page.
// Phase 22 — hides archived customers (archived_at IS NULL).
import { createClient } from '@supabase/supabase-js';
import type { CustomerRow } from './types';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);
export interface CustomerSummary extends CustomerRow {
  project_count:        number;
  comm_count:           number;
  last_comm_at:         string | null;
}
export async function fetchCustomersList(): Promise<CustomerSummary[]> {
  const [customersRes, projectsRes, commsRes] = await Promise.all([
    supabase.from('customers').select('*').is('archived_at', null).order('created_at', { ascending: false }),
    supabase.from('projects').select('customer_id'),
    supabase.from('customer_communications').select('customer_id, occurred_at'),
  ]);
  if (customersRes.error) {
    console.error('[fetchCustomersList] customers error:', customersRes.error.message);
    return [];
  }
  const customers = (customersRes.data || []) as CustomerRow[];
  const projects  = (projectsRes.data  || []) as { customer_id: string }[];
  const comms     = (commsRes.data     || []) as { customer_id: string; occurred_at: string }[];
  const projectCount  = new Map<string, number>();
  const commCount     = new Map<string, number>();
  const lastCommAt    = new Map<string, string>();
  for (const p of projects) {
    projectCount.set(p.customer_id, (projectCount.get(p.customer_id) || 0) + 1);
  }
  for (const c of comms) {
    commCount.set(c.customer_id, (commCount.get(c.customer_id) || 0) + 1);
    const existing = lastCommAt.get(c.customer_id);
    if (!existing || c.occurred_at > existing) {
      lastCommAt.set(c.customer_id, c.occurred_at);
    }
  }
  const summaries: CustomerSummary[] = customers.map((c) => ({
    ...c,
    project_count: projectCount.get(c.id) || 0,
    comm_count:    commCount.get(c.id) || 0,
    last_comm_at:  lastCommAt.get(c.id) || null,
  }));
  summaries.sort((a, b) => {
    const aTime = a.last_comm_at || a.created_at;
    const bTime = b.last_comm_at || b.created_at;
    return bTime.localeCompare(aTime);
  });
  return summaries;
}
