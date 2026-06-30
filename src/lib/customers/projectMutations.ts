'use server';

// src/lib/customers/projectMutations.ts
// Phase 19 Stage B step 5 — updateProjectStatus (inline ProjectStatusBadge).
// Phase 22 — createProject (add-project form on customer file).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

const PROJECT_STATUSES = [
  'ליד',
  'שיחת בירור',
  'הצעת מחיר נשלחה',
  'אושר',
  'שולמה מקדמה',
  'תשלום מלא',
  'הסתיים',
  'אבוד',
] as const;
type ProjectStatus = typeof PROJECT_STATUSES[number];

export interface UpdateProjectStatusInput {
  projectId:  string;
  customerId: string;
  newStatus:  ProjectStatus;
}
export interface MutationResult {
  ok:    boolean;
  error: string | null;
}

export async function updateProjectStatus(input: UpdateProjectStatusInput): Promise<MutationResult> {
  if (!input.projectId)  return { ok: false, error: 'projectId missing' };
  if (!input.customerId) return { ok: false, error: 'customerId missing' };
  if (!PROJECT_STATUSES.includes(input.newStatus)) {
    return { ok: false, error: 'סטטוס לא תקין: ' + input.newStatus };
  }
  const sb = getServerSupabase();
  const patch: Record<string, string | null> = {
    status:     input.newStatus,
    updated_at: new Date().toISOString(),
  };
  const today = new Date().toISOString().slice(0, 10);
  if (input.newStatus === 'הצעת מחיר נשלחה') patch.quote_sent_date      = today;
  if (input.newStatus === 'אושר')            patch.approved_date         = today;
  if (input.newStatus === 'שולמה מקדמה')     patch.production_start_date = today;
  if (input.newStatus === 'הסתיים')          patch.done_date             = today;
  const res = await sb.from('projects').update(patch).eq('id', input.projectId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/customers/' + input.customerId);
  return { ok: true, error: null };
}

export interface CreateProjectInput {
  customerId: string;
  titleHe: string;
  status?: string;
  stoneTypeHe?: string;
  dimensions?: string;
  descriptionHe?: string;
  siteId?: string | null;
}
export interface ProjectMutationResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const CREATE_ALLOWED_STATUSES = ['ליד', 'שיחת בירור', 'הצעת מחיר נשלחה', 'אושר', 'שולמה מקדמה', 'תשלום מלא', 'הסתיים', 'אבוד'];

export async function createProject(input: CreateProjectInput): Promise<ProjectMutationResult> {
  const title = (input.titleHe || '').trim().replace(/\s+/g, ' ');
  if (!title) return { ok: false, error: 'יש להזין כותרת לפרויקט' };
  if (!input.customerId) return { ok: false, error: 'missing customer' };
  const status = CREATE_ALLOWED_STATUSES.includes(input.status || '') ? input.status : 'ליד';
  const nowIso = new Date().toISOString();
  const sb = getServerSupabase();
  const res = await sb
    .from('projects')
    .insert({
      customer_id: input.customerId,
      title_he: title,
      status,
      stone_type_he: input.stoneTypeHe?.trim() || null,
      dimensions: input.dimensions?.trim() || null,
      description_he: input.descriptionHe?.trim() || null,
      site_id: input.siteId || null,
      inquiry_date: nowIso.slice(0, 10),
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id')
    .maybeSingle();
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/customers/' + input.customerId);
  return { ok: true, id: res.data?.id as string | undefined };
}
