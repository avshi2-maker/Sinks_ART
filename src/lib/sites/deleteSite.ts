'use server';

// src/lib/sites/deleteSite.ts
// Phase 34 — delete a site. Children (contacts/tasks/visits) cascade via FK.
// Projects linked to the site get site_id set to null (not deleted).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface DeleteSiteResult { ok: boolean; error?: string; }

export async function deleteSite(siteId: string): Promise<DeleteSiteResult> {
  if (!siteId) return { ok: false, error: 'missing site id' };
  const sb = getServerSupabase();

  // unlink projects first (keep the projects, just detach)
  const unlink = await sb.from('projects').update({ site_id: null }).eq('site_id', siteId);
  if (unlink.error) return { ok: false, error: 'ניתוק פרויקטים נכשל: ' + unlink.error.message };

  // delete the site (contacts/tasks/visits cascade)
  const del = await sb.from('sites').delete().eq('id', siteId);
  if (del.error) return { ok: false, error: del.error.message };

  revalidatePath('/sites');
  return { ok: true };
}
