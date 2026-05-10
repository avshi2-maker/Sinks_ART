'use client';

/**
 * src/components/dashboard/AddTaskInlineForm.tsx
 *
 * Inline expand form for "+ הוסף משימה". Click button → form drops down →
 * fill title + due date + optional customer → submit → server action runs →
 * Next.js revalidates and the new task appears in the strip above.
 *
 * Phase 17.5 — Real tasks table + CRUD (Session 22, 10/05/2026)
 */

import { useState, useTransition } from 'react';
import { createTask } from '@/lib/dashboard/taskMutations';

interface CustomerOption {
  id:      string;
  name_he: string;
}

interface Props {
  customers: CustomerOption[];
}

function todayLocalISO(): string {
  // YYYY-MM-DD in user's local time, suitable for <input type="date">
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AddTaskInlineForm({ customers }: Props) {
  const [open, setOpen]           = useState(false);
  const [title, setTitle]         = useState('');
  const [dueDate, setDueDate]     = useState(todayLocalISO());
  const [customerId, setCustomerId] = useState<string>('');
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle('');
    setDueDate(todayLocalISO());
    setCustomerId('');
    setErrorMsg(null);
  }

  function handleSubmit() {
    if (!title.trim()) {
      setErrorMsg('כותרת המשימה חובה');
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createTask({
        title:      title.trim(),
        dueDate:    dueDate || null,
        customerId: customerId || null,
        source:     'manual',
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'שגיאה בשמירה');
        return;
      }
      reset();
      setOpen(false);  // collapse after successful save
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm text-blue-600 hover:bg-blue-50 py-2 rounded-md border border-dashed border-gray-300 hover:border-blue-300 transition-colors"
        type="button"
      >
        + הוסף משימה
      </button>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="כותרת המשימה"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 bg-white"
        dir="rtl"
        autoFocus
        disabled={isPending}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 bg-white"
          disabled={isPending}
        />
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 bg-white"
          dir="rtl"
          disabled={isPending}
        >
          <option value="">— ללא לקוח —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name_he}</option>
          ))}
        </select>
      </div>
      {errorMsg && (
        <div className="text-xs text-red-600">{errorMsg}</div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          disabled={isPending}
          className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  );
}
