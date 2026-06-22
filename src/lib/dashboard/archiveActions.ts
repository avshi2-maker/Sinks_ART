'use server';

// src/lib/dashboard/archiveActions.ts
// Reversible "hide from dashboard" — sets archived_at. Never hard-deletes; data
// stays intact and can be restored by clearing archived_at in Supabase.

import { createClient } from '@supabase/supabase-js';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function archiveProject(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: 'missing id' };
  const { error } = await sb().from('projects').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.error('[archiveProject]', error.message); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function archiveComm(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: 'missing id' };
  const { error } = await sb().from('customer_communications').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.error('[archiveComm]', error.message); return { ok: false, error: error.message }; }
  return { ok: true };
}
