'use server';

// src/lib/customers/projectMutations.ts
// Phase 19 Stage B step 5 - Server Actions for project mutations.
// First mutation: updateProjectStatus (used by the inline ProjectStatusBadge).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

// The 7 valid statuses, in workflow order. Stored as Hebrew text in the projects.status column.
// PROJECT_STATUSES moved to ProjectStatusBadge.tsx because 'use server' files
// cannot export non-function values. This array stays here for internal validation only.
const PROJECT_STATUSES = [
  'ליד',
  'הצעה נשלחה',
  'מאושר',
  'בייצור',
  'נמסר',
  'הושלם',
  'בוטל',
] as const;

type ProjectStatus = typeof PROJECT_STATUSES[number];

export interface UpdateProjectStatusInput {
  projectId:  string;
  customerId: string;       // needed for revalidatePath after update
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

  // Build patch — update status and stamp the matching workflow date column when relevant
  const patch: Record<string, string | null> = {
    status:     input.newStatus,
    updated_at: new Date().toISOString(),
  };
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (input.newStatus === 'הצעה נשלחה') patch.quote_sent_date       = today;
  if (input.newStatus === 'מאושר')      patch.approved_date          = today;
  if (input.newStatus === 'בייצור')     patch.production_start_date  = today;
  if (input.newStatus === 'נמסר')       patch.delivery_date          = today;
  if (input.newStatus === 'הושלם')      patch.done_date              = today;

  const res = await sb
    .from('projects')
    .update(patch)
    .eq('id', input.projectId);

  if (res.error) {
    return { ok: false, error: res.error.message };
  }

  revalidatePath('/customers/' + input.customerId);
  return { ok: true, error: null };
}
