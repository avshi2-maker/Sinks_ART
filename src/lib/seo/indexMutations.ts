'use server';
// src/lib/seo/indexMutations.ts · updated 23.09.2026 07:57 (Asia/Jerusalem)
// Server Actions for the indexing tracker: mark submitted / indexed / reset, single or bulk.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type IndexAction = 'submitted' | 'indexed' | 'reset';

export async function setIndexStatus(urls: string[], action: IndexAction): Promise<{ ok: boolean; error?: string }> {
  if (!urls.length) return { ok: true };
  const now = new Date().toISOString();
  const patch =
    action === 'submitted' ? { submitted_at: now } :
    action === 'indexed' ? { indexed_at: now } :
    { submitted_at: null, indexed_at: null };
  const { error } = await db().from('index_log').update(patch).in('url', urls);
  revalidatePath('/index-tracker');
  return error ? { ok: false, error: error.message } : { ok: true };
}
