'use client';

/**
 * src/components/dashboard/TaskRow.tsx
 *
 * Single interactive task row. Click the circle to mark done.
 * Optimistic UI: grays out immediately, server action runs in background,
 * Next.js revalidates the parent so the row disappears from the open-tasks list.
 *
 * Phase 17.5 — Real tasks table + CRUD (Session 22, 10/05/2026)
 */

import { useState, useTransition } from 'react';
import { completeTask } from '@/lib/dashboard/taskMutations';
import type { DashboardTask } from '@/lib/dashboard/fetchTasks';

interface Props {
  task: DashboardTask;
}

function urgencyColors(urgency: DashboardTask['urgency']) {
  if (urgency === 'overdue')  return { ring: 'border-red-600',    badge: 'bg-red-50 text-red-800 border-red-200' };
  if (urgency === 'today')    return { ring: 'border-amber-600',  badge: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (urgency === 'tomorrow') return { ring: 'border-blue-500',   badge: 'bg-blue-50 text-blue-800 border-blue-200' };
  if (urgency === 'undated')  return { ring: 'border-gray-300',   badge: 'bg-gray-50 text-gray-700 border-gray-200' };
  return                              { ring: 'border-gray-300',  badge: 'bg-gray-50 text-gray-700 border-gray-200' };
}

function sourceEmoji(src: DashboardTask['source']) {
  if (src === 'whatsapp') return '💬';
  if (src === 'call')     return '📞';
  if (src === 'email')    return '📧';
  if (src === 'calendar') return '📅';
  return                         '✋';  // manual
}

export default function TaskRow({ task }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const colors = urgencyColors(task.urgency);
  const dimmed = optimisticDone || isPending;

  // Build the small context line under the title
  const contextParts: string[] = [];
  if (task.customer_name) contextParts.push(task.customer_name);
  if (task.project_title) contextParts.push(task.project_title);
  const contextLine = contextParts.join(' · ');

  function handleComplete() {
    if (dimmed) return;  // already in flight
    setOptimisticDone(true);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await completeTask(task.id);
      if (!res.ok) {
        // Mutation failed — restore the row and show error
        setOptimisticDone(false);
        setErrorMsg(res.error || 'שגיאה');
        // Auto-clear error after 4s
        setTimeout(() => setErrorMsg(null), 4000);
      }
      // On success: revalidatePath in the action makes the row disappear naturally
    });
  }

  return (
    <div
      className={
        'grid items-center gap-3 px-4 py-3 border-t border-gray-100 transition-opacity ' +
        (dimmed ? 'opacity-40 pointer-events-none' : '')
      }
      style={{ gridTemplateColumns: '24px 1fr 80px 24px' }}
    >
      <button
        onClick={handleComplete}
        disabled={dimmed}
        className={'w-4 h-4 rounded-full border-2 hover:scale-110 transition-transform cursor-pointer ' + colors.ring}
        aria-label="סמן כבוצע"
        type="button"
      ></button>

      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate" title={task.title_he}>
          {task.title_he}
        </div>
        {(contextLine || errorMsg) && (
          <div className={'text-xs mt-0.5 truncate ' + (errorMsg ? 'text-red-600' : 'text-gray-500')}>
            {errorMsg || contextLine}
          </div>
        )}
      </div>

      <span className={'text-xs px-3 py-1 rounded-full text-center font-medium border ' + colors.badge}>
        {task.due_label}
      </span>

      <span className="text-base text-gray-500 text-center" aria-hidden="true">
        {sourceEmoji(task.source)}
      </span>
    </div>
  );
}
