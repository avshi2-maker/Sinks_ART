'use server';

/**
 * src/lib/dashboard/taskMutations.ts
 *
 * Server Actions for task mutations. Client components (TaskRow, TasksStrip's
 * inline add form, /tasks page) call these functions directly — Next.js wires
 * the round-trip automatically because of 'use server' at the top.
 *
 * Each mutation revalidates the affected paths so the UI refreshes.
 *
 * Phase 17.5 — Real tasks table + CRUD (Session 22, 10/05/2026)
 */

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { TaskSource } from './fetchTasks';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

function revalidateTaskViews() {
  revalidatePath('/dashboard');
  revalidatePath('/tasks');
}

// ── createTask ─────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title:      string;            // required, will be trimmed
  dueDate?:   string | null;     // YYYY-MM-DD or null
  customerId?: string | null;    // FK or null
  projectId?:  string | null;    // FK or null
  source?:    TaskSource;        // defaults to 'manual'
  notes?:     string | null;
}

export interface MutationResult {
  ok:    boolean;
  error: string | null;
  id?:   string;
}

export async function createTask(input: CreateTaskInput): Promise<MutationResult> {
  const title = (input.title || '').trim();
  if (!title) {
    return { ok: false, error: 'כותרת המשימה חובה' };
  }

  const sb = getServerSupabase();
  const res = await sb
    .from('tasks')
    .insert({
      title_he:    title,
      notes_he:    (input.notes || '').trim() || null,
      due_date:    input.dueDate || null,
      customer_id: input.customerId || null,
      project_id:  input.projectId || null,
      source:      input.source || 'manual',
      status:      'open',
    })
    .select('id')
    .single();

  if (res.error) {
    return { ok: false, error: res.error.message };
  }

  revalidateTaskViews();
  return { ok: true, error: null, id: res.data.id };
}

// ── completeTask ───────────────────────────────────────────────────────

export async function completeTask(id: string): Promise<MutationResult> {
  if (!id) return { ok: false, error: 'task id missing' };

  const sb = getServerSupabase();
  const res = await sb
    .from('tasks')
    .update({
      status:       'done',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'open');  // safety: only flip if still open

  if (res.error) {
    return { ok: false, error: res.error.message };
  }

  revalidateTaskViews();
  return { ok: true, error: null };
}

// ── cancelTask (unused in v1 but ready) ────────────────────────────────

export async function cancelTask(id: string): Promise<MutationResult> {
  if (!id) return { ok: false, error: 'task id missing' };

  const sb = getServerSupabase();
  const res = await sb
    .from('tasks')
    .update({
      status:       'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'open');

  if (res.error) {
    return { ok: false, error: res.error.message };
  }

  revalidateTaskViews();
  return { ok: true, error: null };
}
