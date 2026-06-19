'use server';

// src/lib/pipeline/jobPipelineData.ts
// Job pipeline server actions. Types/constants live in jobPipelineTypes.ts so that
// this 'use server' module only exports async functions (Next.js requirement).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { JobRow, JobStage, STAGE_META, STAGE_ORDER, PipelineSummary } from '@/lib/pipeline/jobPipelineTypes';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function listJobs(): Promise<JobRow[]> {
  const sb = getServerSupabase();
  const res = await sb.from('job_pipeline').select('*').order('updated_at', { ascending: false });
  if (res.error) { console.error('[listJobs]', res.error.message); return []; }
  return (res.data || []) as JobRow[];
}

export interface CreateJobInput {
  title_he: string;
  customer_name?: string;
  customer_phone?: string;
  customer_city?: string;
  rfq_id?: string;
  supplier_offer_id?: string;
  stage?: JobStage;
  ales_cost?: number;
  customer_total?: number;
  commission?: number;
  notes?: string;
}

export interface JobResult { ok: boolean; error?: string; id?: string; }

export async function createJob(input: CreateJobInput): Promise<JobResult> {
  if (!input.title_he?.trim()) return { ok: false, error: 'missing title' };
  const sb = getServerSupabase();
  const res = await sb.from('job_pipeline').insert({
    title_he: input.title_he.trim(),
    customer_name: input.customer_name || null,
    customer_phone: input.customer_phone || null,
    customer_city: input.customer_city || null,
    rfq_id: input.rfq_id || null,
    supplier_offer_id: input.supplier_offer_id || null,
    stage: input.stage || 'priced',
    ales_cost: input.ales_cost || 0,
    customer_total: input.customer_total || 0,
    commission: input.commission || 0,
    notes: input.notes || null,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/dashboard');
  revalidatePath('/pipeline');
  return { ok: true, id: res.data.id as string };
}

export async function findJobByOfferId(offerId: string): Promise<JobRow | null> {
  const sb = getServerSupabase();
  const res = await sb.from('job_pipeline').select('*').eq('supplier_offer_id', offerId).maybeSingle();
  if (res.error) { console.error('[findJobByOfferId]', res.error.message); return null; }
  return (res.data as JobRow) || null;
}

export async function advanceJobStage(id: string, stage: JobStage): Promise<JobResult> {
  const sb = getServerSupabase();
  const patch: Record<string, unknown> = { stage, updated_at: new Date().toISOString() };
  if (stage === 'ordered') patch.ordered_at = new Date().toISOString();
  if (stage === 'paid') patch.paid_at = new Date().toISOString();
  const res = await sb.from('job_pipeline').update(patch).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/dashboard');
  revalidatePath('/pipeline');
  return { ok: true, id };
}

export async function updateJobValues(id: string, vals: { ales_cost?: number; customer_total?: number; commission?: number; notes?: string }): Promise<JobResult> {
  const sb = getServerSupabase();
  const res = await sb.from('job_pipeline').update({ ...vals, updated_at: new Date().toISOString() }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/pipeline');
  return { ok: true, id };
}

export async function deleteJob(id: string): Promise<JobResult> {
  const sb = getServerSupabase();
  const res = await sb.from('job_pipeline').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/pipeline');
  return { ok: true, id };
}

export async function pipelineSummary(): Promise<PipelineSummary> {
  const jobs = await listJobs();
  const byStage = {} as Record<JobStage, { count: number; value: number }>;
  STAGE_ORDER.forEach((s) => { byStage[s] = { count: 0, value: 0 }; });
  let activeCount = 0, activeValue = 0, paidValueAll = 0, commissionPaidAll = 0;
  for (const j of jobs) {
    const st = ((j.stage as JobStage) in byStage ? (j.stage as JobStage) : 'priced');
    byStage[st].count += 1;
    byStage[st].value += Number(j.customer_total) || 0;
    if (STAGE_META[st]?.active) { activeCount += 1; activeValue += Number(j.customer_total) || 0; }
    if (st === 'paid') { paidValueAll += Number(j.customer_total) || 0; commissionPaidAll += Number(j.commission) || 0; }
  }
  return { byStage, activeCount, activeValue, paidValueAll, commissionPaidAll };
}
