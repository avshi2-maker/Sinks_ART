'use server';

// src/lib/customers/deleteComm.ts
// Phase 22 — delete a single communication/note from a customer's timeline.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface DeleteCommResult {
  ok: boolean;
  error?: string;
}

export async function deleteComm(commId: string, customerId: string): Promise<DeleteCommResult> {
  if (!commId) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('customer_communications').delete().eq('id', commId);
  if (res.error) return { ok: false, error: res.error.message };
  if (customerId) revalidatePath('/customers/' + customerId);
  return { ok: true };
}
