'use server';

// src/lib/quotes/markQuoteSent.ts
// Phase 27 — mark a quote as sent (status=sent, sent_at=now) for sent-tracking + ROI.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface MarkSentResult {
  ok: boolean;
  error?: string;
  sentAt?: string;
}

export async function markQuoteSent(quoteId: string, customerId: string): Promise<MarkSentResult> {
  if (!quoteId) return { ok: false, error: 'missing quote id' };
  const sb = getServerSupabase();
  const now = new Date().toISOString();
  const res = await sb
    .from('quotes')
    .update({ status: 'sent', sent_at: now })
    .eq('id', quoteId);
  if (res.error) return { ok: false, error: res.error.message };
  if (customerId) revalidatePath('/customers/' + customerId);
  return { ok: true, sentAt: now };
}
