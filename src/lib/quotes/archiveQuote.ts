'use server';

// src/lib/quotes/archiveQuote.ts
// Archive / restore a quote. Archiving = status 'archived' (reversible, nothing deleted).
// Archived quotes are hidden from the default /quotes view and excluded from active flows.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface ArchiveResult { ok: boolean; error?: string; }

export async function archiveQuote(quoteId: string): Promise<ArchiveResult> {
  if (!quoteId) return { ok: false, error: 'missing quoteId' };
  const res = await sb().from('quotes')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', quoteId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/quotes');
  revalidatePath('/roi');
  return { ok: true };
}

export async function unarchiveQuote(quoteId: string): Promise<ArchiveResult> {
  if (!quoteId) return { ok: false, error: 'missing quoteId' };
  const res = await sb().from('quotes')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', quoteId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/quotes');
  revalidatePath('/roi');
  return { ok: true };
}
