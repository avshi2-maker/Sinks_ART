// src/lib/seo/indexTracker.ts · updated 23.09.2026 13:07 (Asia/Jerusalem)
// Reads the LIVE sitemap of marble-art.co.il, registers any new URL in index_log,
// and returns the merged list. The sitemap is the single source of truth, so new
// project/case pages appear here the moment the public site publishes them.

import { createClient } from '@supabase/supabase-js';
import type { TrackedUrl, UrlKind, IndexStatus } from './indexTypes';

export const SITEMAP_URL = 'https://www.marble-art.co.il/sitemap.xml';
export const GSC_PROPERTY = process.env.GSC_PROPERTY || 'https://www.marble-art.co.il/';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function kindOf(path: string): UrlKind {
  if (path.startsWith('/projects/')) return 'project';
  if (path.startsWith('/guides')) return 'guide';
  if (path.startsWith('/marble-sinks/')) return 'city';
  if (path.startsWith('/videos')) return 'video';
  return 'core';
}

function decodePath(u: string): string {
  try { return decodeURI(new URL(u).pathname) || '/'; } catch { return u; }
}

async function readSitemap(): Promise<{ loc: string; lastmod: string | null }[]> {
  const res = await fetch(SITEMAP_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('sitemap.xml לא נטען (' + res.status + ')');
  const xml = await res.text();
  const out: { loc: string; lastmod: string | null }[] = [];
  const re = /<url>([\s\S]*?)<\/url>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const loc = /<loc>([\s\S]*?)<\/loc>/.exec(m[1])?.[1]?.trim();
    const lastmod = /<lastmod>([\s\S]*?)<\/lastmod>/.exec(m[1])?.[1]?.trim() || null;
    if (loc) out.push({ loc, lastmod });
  }
  return out;
}

export async function fetchTrackedUrls(): Promise<{ rows: TrackedUrl[]; error: string | null }> {
  const sb = db();
  let live: { loc: string; lastmod: string | null }[] = [];
  let error: string | null = null;
  try { live = await readSitemap(); } catch (e) { error = (e as Error).message; }

  // Register URLs seen for the first time (idempotent upsert, keeps existing dates).
  if (live.length) {
    const fresh = live.map((l) => ({ url: l.loc, kind: kindOf(decodePath(l.loc)) }));
    const { error: upErr } = await sb.from('index_log').upsert(fresh, { onConflict: 'url', ignoreDuplicates: true });
    if (upErr) error = 'index_log: ' + upErr.message;
  }

  const { data, error: selErr } = await sb.from('index_log').select('*');
  if (selErr) return { rows: [], error: 'index_log: ' + selErr.message };

  const lastmodBy = new Map(live.map((l) => [l.loc, l.lastmod]));
  const rows: TrackedUrl[] = (data || []).map((r) => {
    const status: IndexStatus = r.indexed_at ? 'indexed' : r.submitted_at ? 'submitted' : 'new';
    return {
      url: r.url,
      path: decodePath(r.url),
      kind: (r.kind as UrlKind) || kindOf(decodePath(r.url)),
      lastmod: lastmodBy.get(r.url) ?? null,
      first_seen: r.first_seen,
      submitted_at: r.submitted_at,
      indexed_at: r.indexed_at,
      bing_sent_at: r.bing_sent_at ?? null,
      bing_indexed_at: r.bing_indexed_at ?? null,
      status,
      inSitemap: lastmodBy.has(r.url) || !live.length,
    };
  });

  // Newest first, projects before everything else inside the same day.
  rows.sort((a, b) => (b.first_seen || '').localeCompare(a.first_seen || '') || (a.kind === 'project' ? -1 : 1));
  return { rows, error };
}
