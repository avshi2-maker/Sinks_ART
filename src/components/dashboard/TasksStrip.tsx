/**
 * src/components/dashboard/TasksStrip.tsx
 *
 * Server component — reads real open tasks from Supabase, renders TaskRow
 * components. Includes inline add-task form (client) and link to /tasks.
 *
 * Replaces the Phase 17 placeholder version that had hardcoded mock tasks.
 *
 * Phase 17.5 — Real tasks table + CRUD (Session 22, 10/05/2026)
 */

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { fetchTasks } from '@/lib/dashboard/fetchTasks';
import TaskRow from './TaskRow';
import AddTaskInlineForm from './AddTaskInlineForm';

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

export default async function TasksStrip() {
  let tasks: Awaited<ReturnType<typeof fetchTasks>> = [];
  let fetchError: string | null = null;

  try {
    tasks = await fetchTasks(10);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
  }

  const customers = await fetchCustomerOptions();

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">
          📋 משימות פתוחות <span className="text-gray-400 font-normal">({tasks.length})</span>
        </div>
        <span className="text-xs text-gray-400">מסודר לפי דחיפות</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {fetchError && (
          <div className="px-4 py-3 bg-red-50 text-xs text-red-700">
            שגיאה בטעינת המשימות: {fetchError}
          </div>
        )}

        {!fetchError && tasks.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            אין משימות פתוחות — התחל עם "הוסף משימה" למטה
          </div>
        )}

        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}

        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <AddTaskInlineForm customers={customers} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-gray-400 italic">
          לחיצה על העיגול תסמן כבוצע · נתונים חיים מ-Supabase
        </span>
        <Link href="/tasks" className="text-xs text-blue-600 no-underline hover:underline">
          כל המשימות ←
        </Link>
      </div>
    </div>
  );
}
