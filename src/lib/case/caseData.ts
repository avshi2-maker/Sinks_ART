// src/lib/case/caseData.ts · updated 23.09.2026 16:51 (Asia/Jerusalem)
// Server-side data for /case-studies. Includes the Ales → CRM bridge (pull model):
// finished jobs are read from the Ales Supabase project and inserted as 'new' case studies.
// Pull = no webhook secret anywhere; runs every time the inbox opens + on the 🔄 button.

import { createClient } from '@supabase/supabase-js';
import type { CaseStudy } from './caseTypes';

export function crmDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

function alesDb() {
  const url = process.env.ALES_SUPABASE_URL;
  const key = process.env.ALES_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface SyncResult { ok: boolean; added: number; seen: number; error?: string }

interface AlesRow {
  id: string; job_type: string; title: string | null; city: string | null; customer: string | null;
  fields: Record<string, unknown> | null; notes: string | null; media: unknown[] | null; after_media: unknown[] | null;
  testimonial: { rating?: number; quote?: string; first_name?: string; voice?: unknown } | null;
  consent: Record<string, unknown> | null; finish_date: string | null; created_at: string;
  sketches?: unknown[] | null;
}

export async function syncFromAles(): Promise<SyncResult> {
  const ales = alesDb();
  if (!ales) return { ok: false, added: 0, seen: 0, error: 'חסרים ALES_SUPABASE_URL / ALES_SUPABASE_ANON_KEY בהגדרות Vercel של ה-CRM' };
  const { data, error } = await ales.from('ales_jobs').select('*').eq('status', 'finished').neq('job_type', 'testimonial');
  if (error) return { ok: false, added: 0, seen: 0, error: 'Ales: ' + error.message };
  const rows = (data || []) as AlesRow[];
  if (!rows.length) return { ok: true, added: 0, seen: 0 };

  const sb = crmDb();
  const { data: existing } = await sb.from('case_studies').select('ales_job_id').in('ales_job_id', rows.map((r) => r.id));
  const have = new Set((existing || []).map((e: { ales_job_id: string }) => e.ales_job_id));
  const fresh = rows.filter((r) => !have.has(r.id)).map((r) => {
    const t = r.testimonial || {};
    return {
      ales_job_id: r.id,
      status: 'new',
      job_type: r.job_type,
      title_raw: r.title,
      city: r.city,
      customer_name: r.customer,
      first_name: t.first_name || null,
      fields: r.fields || {},
      notes: r.notes,
      before_media: r.media || [],
      after_media: r.after_media || [],
      voice: t.voice || null,
      rating: t.rating || null,
      quote: t.quote || null,
      consent: r.consent || {},
      finish_date: r.finish_date,
      ales_created_at: r.created_at,
      sketches: r.sketches || [],
    };
  });
  if (!fresh.length) return { ok: true, added: 0, seen: rows.length };
  const ins = await sb.from('case_studies').insert(fresh);
  if (ins.error) return { ok: false, added: 0, seen: rows.length, error: 'case_studies: ' + ins.error.message };
  return { ok: true, added: fresh.length, seen: rows.length };
}

// Jobs Ales opened but hasn't finished (read-only, live).
export async function fetchOpenAlesJobs() {
  const ales = alesDb();
  if (!ales) return [];
  const { data } = await ales.from('ales_jobs').select('id,title,city,customer,job_type,created_at,media,sketches,fields').eq('status', 'open').neq('job_type', 'testimonial').order('created_at', { ascending: false });
  return (data || []) as import('@/components/case/OpenAlesJobs').OpenJob[];
}

export async function fetchCases(): Promise<CaseStudy[]> {
  const { data, error } = await crmDb().from('case_studies').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[fetchCases]', error.message); return []; }
  return (data || []) as CaseStudy[];
}

export async function fetchCase(id: string): Promise<CaseStudy | null> {
  const { data, error } = await crmDb().from('case_studies').select('*').eq('id', id).maybeSingle();
  if (error) { console.error('[fetchCase]', error.message); return null; }
  return (data as CaseStudy) || null;
}

export async function isSlugTaken(slug: string, id: string): Promise<boolean> {
  if (!slug) return false;
  const { data } = await crmDb().from('case_studies').select('id').eq('slug', slug).neq('id', id).limit(1);
  return !!(data && data.length);
}
