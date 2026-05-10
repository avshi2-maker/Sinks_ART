/**
 * src/lib/dashboard/fetchTasks.ts
 *
 * Server-side function: reads open tasks from Supabase, joins customer + project
 * names, computes urgency tier and Hebrew due-date badge label, sorts by urgency.
 *
 * Phase 17.5 — Real tasks table + CRUD (Session 22, 10/05/2026)
 */

import { createClient } from '@supabase/supabase-js';

export type TaskUrgency = 'overdue' | 'today' | 'tomorrow' | 'future' | 'undated';
export type TaskSource  = 'whatsapp' | 'call' | 'email' | 'manual' | 'calendar';

export interface DashboardTask {
  id:            string;
  title_he:      string;
  notes_he:      string | null;
  source:        TaskSource;
  due_date:      string | null;
  customer_id:   string | null;
  customer_name: string | null;
  project_id:    string | null;
  project_title: string | null;
  urgency:       TaskUrgency;
  due_label:     string;
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Returns YYYY-MM-DD for today in Asia/Jerusalem. */
function todayJerusalem(): string {
  const now = new Date();
  const j = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const y = j.getFullYear();
  const m = String(j.getMonth() + 1).padStart(2, '0');
  const d = String(j.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Compares two YYYY-MM-DD strings as integers (lexicographic == chronological). */
function dateCmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function classifyUrgency(dueDate: string | null, todayStr: string): TaskUrgency {
  if (!dueDate) return 'undated';
  const cmp = dateCmp(dueDate, todayStr);
  if (cmp < 0) return 'overdue';
  if (cmp === 0) return 'today';

  // Compute tomorrow in Jerusalem time for comparison
  const j = new Date(todayStr + 'T00:00:00');
  j.setDate(j.getDate() + 1);
  const tomorrowStr = `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, '0')}-${String(j.getDate()).padStart(2, '0')}`;
  if (dateCmp(dueDate, tomorrowStr) === 0) return 'tomorrow';

  return 'future';
}

function formatDueLabel(dueDate: string | null, urgency: TaskUrgency): string {
  if (urgency === 'undated') return '—';
  if (urgency === 'overdue') return 'באיחור';
  if (urgency === 'today')   return 'היום';
  if (urgency === 'tomorrow') return 'מחר';
  // 'future' — show DD.M format (Israeli short)
  if (!dueDate) return '—';
  const [, m, d] = dueDate.split('-');
  return `${parseInt(d, 10)}.${parseInt(m, 10)}`;
}

const URGENCY_RANK: Record<TaskUrgency, number> = {
  overdue:  0,
  today:    1,
  tomorrow: 2,
  future:   3,
  undated:  4,
};

export async function fetchTasks(limit: number = 10): Promise<DashboardTask[]> {
  const sb = getServerSupabase();
  const todayStr = todayJerusalem();

  const res = await sb
    .from('tasks')
    .select(`
      id, title_he, notes_he, source, due_date, customer_id, project_id,
      customers(name_he),
      projects(title_he)
    `)
    .eq('status', 'open')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (res.error) {
    throw new Error('fetchTasks query failed: ' + res.error.message);
  }

  type RawRow = {
    id: string;
    title_he: string;
    notes_he: string | null;
    source: TaskSource;
    due_date: string | null;
    customer_id: string | null;
    project_id: string | null;
    customers: { name_he: string } | { name_he: string }[] | null;
    projects:  { title_he: string } | { title_he: string }[] | null;
  };

  const tasks: DashboardTask[] = (res.data || []).map((r: RawRow) => {
    const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
    const proj = Array.isArray(r.projects)  ? r.projects[0]  : r.projects;
    const urgency = classifyUrgency(r.due_date, todayStr);
    return {
      id:            r.id,
      title_he:      r.title_he,
      notes_he:      r.notes_he,
      source:        r.source,
      due_date:      r.due_date,
      customer_id:   r.customer_id,
      customer_name: cust?.name_he ?? null,
      project_id:    r.project_id,
      project_title: proj?.title_he ?? null,
      urgency,
      due_label:     formatDueLabel(r.due_date, urgency),
    };
  });

  // Sort by urgency rank, then by due_date ascending within same tier
  tasks.sort((a, b) => {
    const r = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (r !== 0) return r;
    if (a.due_date && b.due_date) return dateCmp(a.due_date, b.due_date);
    return 0;
  });

  return tasks;
}
