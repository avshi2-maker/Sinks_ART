'use server';
// src/lib/case/caseMutations.ts · updated 23.09.2026 13:07 (Asia/Jerusalem)
// Server Actions for /case-studies: sync, save edits, publish (gates re-checked server-side), unpublish, archive, link customer.

import { revalidatePath } from 'next/cache';
import { crmDb, fetchCase, isSlugTaken, syncFromAles, type SyncResult } from './caseData';
import { runGates, allPass } from './gates';
import type { CaseGen, CaseStatus } from './caseTypes';
import { SITE_URL } from './caseTypes';

// IndexNow: public key, also served at https://www.marble-art.co.il/<key>.txt (Bing / Yandex / Seznam; Bing feeds ChatGPT search + Copilot).
const INDEXNOW_KEY = '35d431f30babbe96a9a401bd0d29be18';

function touch(id?: string) {
  revalidatePath('/case-studies');
  if (id) revalidatePath('/case-studies/' + id);
  revalidatePath('/index-tracker');
}

export async function syncNow(): Promise<SyncResult> {
  const r = await syncFromAles();
  touch();
  return r;
}

export async function saveGen(id: string, gen: CaseGen): Promise<{ ok: boolean; error?: string }> {
  const slug = (gen.slug || '').trim() || null;
  const { error } = await crmDb().from('case_studies').update({ gen, slug, updated_at: new Date().toISOString() }).eq('id', id);
  touch(id);
  if (error) return { ok: false, error: error.message.includes('duplicate') ? 'הכתובת (slug) כבר בשימוש בפרויקט אחר' : error.message };
  return { ok: true };
}

async function pingIndexNow(url: string): Promise<string> {
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'www.marble-art.co.il', key: INDEXNOW_KEY, keyLocation: SITE_URL + '/' + INDEXNOW_KEY + '.txt', urlList: [url, SITE_URL + '/projects'] }),
    });
    return 'IndexNow ' + res.status;
  } catch (e) {
    return 'IndexNow נכשל: ' + (e as Error).message;
  }
}

export async function publishCase(id: string, gen: CaseGen): Promise<{ ok: boolean; error?: string; url?: string; ping?: string }> {
  const saved = await saveGen(id, gen);
  if (!saved.ok) return saved;
  const c = await fetchCase(id);
  if (!c) return { ok: false, error: 'לא נמצא' };
  const taken = await isSlugTaken(c.gen.slug || '', id);
  const gates = runGates(c, c.gen, taken);
  if (!allPass(gates)) return { ok: false, error: 'לא כל הבדיקות עברו: ' + gates.filter((g) => !g.pass).map((g) => g.label).join(' · ') };
  const now = new Date().toISOString();
  const { error } = await crmDb().from('case_studies').update({ status: 'published', published_at: c.published_at || now, updated_at: now }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  const url = SITE_URL + '/projects/' + c.gen.slug;
  const ping = await pingIndexNow(url);
  if (/ 20[02]$/.test(ping)) await crmDb().from('index_log').upsert({ url, kind: 'project', bing_sent_at: new Date().toISOString() }, { onConflict: 'url' });
  touch(id);
  return { ok: true, url, ping };
}

export async function setCaseStatus(id: string, status: CaseStatus): Promise<{ ok: boolean; error?: string }> {
  const { error } = await crmDb().from('case_studies').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  touch(id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function addCaseMedia(id: string, items: { url: string; type: string; public_id: string }[]): Promise<{ ok: boolean; error?: string }> {
  const c = await fetchCase(id);
  if (!c) return { ok: false, error: 'לא נמצא' };
  const after = [...(c.after_media || []), ...items];
  const { error } = await crmDb().from('case_studies').update({ after_media: after, updated_at: new Date().toISOString() }).eq('id', id);
  touch(id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function linkCustomer(id: string, customerId: string | null): Promise<{ ok: boolean; error?: string }> {
  const { error } = await crmDb().from('case_studies').update({ customer_id: customerId, updated_at: new Date().toISOString() }).eq('id', id);
  touch(id);
  return error ? { ok: false, error: error.message } : { ok: true };
}
