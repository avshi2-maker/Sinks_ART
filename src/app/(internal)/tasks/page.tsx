/**
 * src/app/(internal)/tasks/page.tsx
 *
 * Full-list tasks view at /tasks. Lives inside the (internal) route group
 * so it inherits TopNav. Reuses TaskRow + AddTaskInlineForm from the
 * dashboard — same components, no duplication.
 *
 * Phase 17.5 — Real tasks table + CRUD (Session 22, 10/05/2026)
 */

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { fetchTasks } from '@/lib/dashboard/fetchTasks';
import TaskRow from '@/components/dashboard/TaskRow';
import AddTaskInlineForm from '@/components/dashboard/AddTaskInlineForm';

export const dynamic = 'force-dynamic';

async function fetchCustomerOptions(): Promise<{ id: string; name_he: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const res = await sb
    .from('customers')
    .select('id, name_he')
    .order('name_he', { ascending: true })
    .limit(200);
  if (res.error) return [];
  return (res.data || []).map((c: { id: string; name_he: string }) => ({ id: c.id, name_he: c.name_he }));
}

export default async function TasksPage() {
  let tasks: Awaited<ReturnType<typeof fetchTasks>> = [];
  let fetchError: string | null = null;

  try {
    tasks = await fetchTasks(100);  // up to 100 open tasks (vs 10 on dashboard)
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
  }

  const customers = await fetchCustomerOptions();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center text-xl">📋</div>
          <div>
            <div className="text-base font-medium text-gray-900">משימות פתוחות</div>
            <div className="text-xs text-gray-500">כל המשימות הפתוחות, מסודרות לפי דחיפות</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">
          ← חזרה ללוח הבקרה
        </Link>
      </div>

      <div className="mb-4">
        <AddTaskInlineForm customers={customers} />
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          שגיאה בטעינת המשימות: {fetchError}
        </div>
      )}

      {!fetchError && tasks.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-8 text-center text-sm text-gray-500">
          אין משימות פתוחות כרגע — התחל עם "הוסף משימה" למעלה
        </div>
      )}

      {tasks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
            {tasks.length} משימות
          </div>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
