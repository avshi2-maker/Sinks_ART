'use server';

// src/lib/quotes/deleteQuote.ts
// Phase 33 — delete a whole quote (its lines first, then the quote row).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface DeleteQuoteResult { ok: boolean; error?: string; }

export async function deleteQuote(quoteId: string): Promise<DeleteQuoteResult> {
  if (!quoteId) return { ok: false, error: 'missing quote id' };
  const sb = getServerSupabase();

  const delLines = await sb.from('quote_lines').delete().eq('quote_id', quoteId);
  if (delLines.error) return { ok: false, error: 'מחיקת שורות נכשלה: ' + delLines.error.message };

  const delQuote = await sb.from('quotes').delete().eq('id', quoteId);
  if (delQuote.error) return { ok: false, error: 'מחיקת ההצעה נכשלה: ' + delQuote.error.message };

  revalidatePath('/quotes');
  return { ok: true };
}
