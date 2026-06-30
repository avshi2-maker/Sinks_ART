'use client';

// src/components/customers/ProjectStatusBadge.tsx
// Phase 19 Stage B step 5 - Interactive project status badge.
// Looks like a colored badge; clicking opens a dropdown of the 7 statuses.
// Selecting a new status calls the server action and revalidates the page.

import { useState, useTransition, useRef, useEffect } from 'react';
import { updateProjectStatus } from '@/lib/customers/projectMutations';

// These belong in the client file - 'use server' files can only export async functions in Next.js
const PROJECT_STATUSES = ['ליד', 'שיחת בירור', 'הצעת מחיר נשלחה', 'אושר', 'שולמה מקדמה', 'תשלום מלא', 'הסתיים', 'אבוד'] as const;
type ProjectStatus = typeof PROJECT_STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  'ליד':              'bg-amber-100 text-amber-800 border-amber-300',
  'שיחת בירור':       'bg-sky-100 text-sky-800 border-sky-300',
  'הצעת מחיר נשלחה':  'bg-blue-100 text-blue-800 border-blue-300',
  'אושר':             'bg-indigo-100 text-indigo-800 border-indigo-300',
  'שולמה מקדמה':      'bg-purple-100 text-purple-800 border-purple-300',
  'תשלום מלא':        'bg-teal-100 text-teal-800 border-teal-300',
  'הסתיים':           'bg-green-100 text-green-800 border-green-300',
  'אבוד':             'bg-red-100 text-red-800 border-red-300',
};

interface Props {
  projectId:     string;
  customerId:    string;
  currentStatus: string;
}

export default function ProjectStatusBadge({ projectId, customerId, currentStatus }: Props) {
  const [open, setOpen]           = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(newStatus: ProjectStatus) {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateProjectStatus({ projectId, customerId, newStatus });
      if (!res.ok) {
        setErrorMsg(res.error || 'שגיאה');
        return;
      }
      setOpen(false);
    });
  }

  const statusClass = STATUS_COLORS[currentStatus] ?? 'bg-stone-100 text-stone-700 border-stone-300';

  return (
    <div ref={wrapperRef} className="relative inline-block" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80 disabled:opacity-50 cursor-pointer ' +
          statusClass
        }
      >
        {isPending ? 'מעדכן...' : currentStatus}
        <span aria-hidden="true" className="text-[0.6rem] opacity-60">▼</span>
      </button>

      {open && !isPending && (
        <div className="absolute z-10 top-full mt-1 right-0 bg-white border border-stone-200 rounded-md shadow-lg py-1 min-w-[140px]">
          {PROJECT_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            const cls = STATUS_COLORS[status] ?? 'bg-stone-100 text-stone-700 border-stone-300';
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleSelect(status)}
                disabled={isCurrent}
                className={
                  'w-full text-right px-3 py-1.5 text-xs hover:bg-stone-50 transition-colors flex items-center justify-between gap-2 ' +
                  (isCurrent ? 'opacity-50 cursor-default' : 'cursor-pointer')
                }
              >
                <span className={'inline-flex px-2 py-0.5 rounded-full border ' + cls}>
                  {status}
                </span>
                {isCurrent && <span className="text-stone-400 text-[0.7rem]">נוכחי</span>}
              </button>
            );
          })}
        </div>
      )}

      {errorMsg && (
        <div className="absolute top-full mt-1 right-0 text-xs text-red-600 whitespace-nowrap bg-white px-2 py-1 border border-red-200 rounded shadow z-10">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
