'use server';
// src/lib/seo/indexMutations.ts · updated 23.09.2026 13:07 (Asia/Jerusalem)
// Server Actions for the indexing tracker: mark submitted / indexed / reset, single or bulk.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type IndexAction = 'submitted' | 'indexed' | 'reset' | 'bing_indexed' | 'bing_reset';

export async function setIndexStatus(urls: string[], action: IndexAction): Promise<{ ok: boolean; error?: string }> {
  if (!urls.length) return { ok: true };
  const now = new Date().toISOString();
  const patch =
    action === 'submitted' ? { submitted_at: now } :
    action === 'indexed' ? { indexed_at: now } :
    action === 'bing_indexed' ? { bing_indexed_at: now } :
    action === 'bing_reset' ? { bing_sent_at: null, bing_indexed_at: null } :
    { submitted_at: null, indexed_at: null };
  const { error } = await db().from('index_log').update(patch).in('url', urls);
  revalidatePath('/index-tracker');
  return error ? { ok: false, error: error.message } : { ok: true };
}

// IndexNow (Bing, Yandex, Seznam; Bing feeds ChatGPT search + Copilot). Up to 10,000 URLs per call, same host only.
const INDEXNOW_KEY = '35d431f30babbe96a9a401bd0d29be18';

export async function sendToBing(urls: string[]): Promise<{ ok: boolean; error?: string; status?: number }> {
  const list = urls.filter((u) => u.startsWith('https://www.marble-art.co.il/'));
  if (!list.length) return { ok: false, error: 'אין כתובות של www.marble-art.co.il' };
  let status = 0;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'www.marble-art.co.il', key: INDEXNOW_KEY, keyLocation: 'https://www.marble-art.co.il/' + INDEXNOW_KEY + '.txt', urlList: list }),
    });
    status = res.status;
    if (res.status !== 200 && res.status !== 202) return { ok: false, status, error: 'IndexNow החזיר ' + res.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const { error } = await db().from('index_log').update({ bing_sent_at: new Date().toISOString() }).in('url', list);
  revalidatePath('/index-tracker');
  return error ? { ok: false, status, error: error.message } : { ok: true, status };
}
