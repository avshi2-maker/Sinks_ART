'use client';

// src/components/sites/SiteTasks.tsx
// Phase 34 — site tasks: add + toggle done + delete.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addSiteTask, toggleSiteTask, deleteSiteTask } from '@/lib/sites/siteMutations';
import type { SiteTask } from '@/lib/sites/sitesData';

function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString('he-IL'); }

export default function SiteTasks({ siteId, tasks }: { siteId: string; tasks: SiteTask[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (!title.trim()) { setError('כותרת חובה'); return; }
    setBusy(true);
    const res = await addSiteTask({ siteId, title_he: title, due_date: due || null });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'נכשל'); return; }
    setTitle(''); setDue(''); setOpen(false);
    router.refresh();
  }
  async function toggle(id: string, done: boolean) {
    const res = await toggleSiteTask(id, done, siteId);
    if (!res.ok) { window.alert('עדכון נכשל: ' + (res.error || '')); return; }
    router.refresh();
  }
  async function remove(id: string) {
    if (!window.confirm('למחוק משימה זו?')) return;
    const res = await deleteSiteTask(id, siteId);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <section className="mb-6" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-stone-700">משימות ({tasks.length})</h2>
        <button onClick={() => setOpen(!open)} className="text-xs text-blue-600 hover:underline">{open ? 'ביטול' : '+ הוסף משימה'}</button>
      </div>

      {open && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 mb-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה צריך לעשות" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500">תאריך יעד:</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="ltr" />
          </div>
          {error && (<div className="text-xs text-red-600">{error}</div>)}
          <button onClick={add} disabled={busy} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{busy ? 'שומר...' : 'שמור'}</button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין משימות.</div>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((t) => (
            <div key={t.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" checked={t.done} onChange={(e) => toggle(t.id, e.target.checked)} />
                <span className={t.done ? 'text-sm text-stone-400 line-through' : 'text-sm text-stone-800'}>{t.title_he}</span>
              </label>
              {t.due_date && (<span className="text-xs text-stone-500">{fmtDate(t.due_date)}</span>)}
              <button onClick={() => remove(t.id)} title="מחק" className="text-stone-300 hover:text-red-600 text-sm">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
