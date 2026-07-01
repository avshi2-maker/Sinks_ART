// src/lib/customers/fetchContacts.ts
// Active contacts for a customer, primary first, then by creation order.

import { createClient } from '@supabase/supabase-js';
import type { ContactRow } from './intakeTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function fetchContacts(customerId: string): Promise<ContactRow[]> {
  const res = await sb()
    .from('customer_contacts')
    .select('id, name, title, phone, email, is_primary')
    .eq('customer_id', customerId)
    .is('archived_at', null)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
  if (res.error) { console.error('[fetchContacts]', res.error.message); return []; }
  return (res.data || []) as ContactRow[];
}
