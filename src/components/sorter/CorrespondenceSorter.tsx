'use client';

// src/components/sorter/CorrespondenceSorter.tsx
// Phase 29 — paste WhatsApp blob -> AI sorts into bucket+party -> review & approve -> save.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSortedMessages } from '@/lib/sorter/saveSortedMessages';

interface ProjectLite { id: string; title_he: string | null; }
interface Props { customerId: string; projects?: ProjectLite[]; }

interface Row { text: string; bucket: string; party: string; }

const BUCKETS = [
  { v: 'price', l: '💰 מחיר' },
  { v: 'spec', l: '📐 טכני' },
  { v: 'options', l: '🎨 אפשרויות' },
  { v: 'logistics', l: '📅 לוגיסטיקה' },
  { v: 'general', l: '💬 כללי' },
];
const PARTIES = [
  { v: 'customer', l: 'לקוח' },
  { v: 'ales', l: 'אלס' },
  { v: 'unknown', l: 'לא ידוע' },
];

export default function CorrespondenceSorter({ customerId, projects = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [projectId, setProjectId] = useState('');
  const [sorting, setSorting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function handleSort() {
    setError(null); setSavedMsg(null);
    if (!blob.trim()) { setError('הדבק תכתובת למיון'); return; }
    setSorting(true);
    try {
      const res = await fetch('/api/sort-correspondence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: blob }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'מיון נכשל'); setSorting(false); return; }
      setRows(data.messages as Row[]);
      setCost(typeof data.apiCostUsd === 'number' ? data.apiCostUsd : null);
    } catch (e) {
      setError('שגיאת רשת: ' + (e instanceof Error ? e.message : String(e)));
    }
    setSorting(false);
  }

  function updateRow(i: number, field: 'bucket' | 'party', value: string) {
    if (!rows) return;
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  }

  function removeRow(i: number) {
    if (!rows) return;
    setRows(rows.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!rows || rows.length === 0) return;
    setSaving(true); setError(null);
    const res = await saveSortedMessages({ customerId, projectId: projectId || null, messages: rows });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setSavedMsg('נשמרו ' + (res.saved || 0) + ' הודעות בתיק ✓');
    setRows(null); setBlob(''); setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-sm text-purple-700 hover:bg-purple-50 py-2 mb-4 rounded-md border border-dashed border-purple-300 hover:border-purple-400 transition-colors">
        🗂️ מיין תכתובת וואטסאפ (AI)
      </button>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 space-y-2" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-800">🗂️ מיון תכתובת (AI)</span>
        <button onClick={() => { setOpen(false); setRows(null); setError(null); }} className="text-xs text-stone-500 hover:text-stone-700">סגור</button>
      </div>

      {!rows && (
        <>
          <textarea value={blob} onChange={(e) => setBlob(e.target.value)} rows={6} placeholder="הדבק כאן את כל הודעות הוואטסאפ (מעורבב) — ה-AI יפצל וימיין..." className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-purple-400 bg-white resize-y" dir="rtl" disabled={sorting} />
          <button onClick={handleSort} disabled={sorting} className="text-sm px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50">{sorting ? 'ממיין...' : '✨ מיין'}</button>
        </>
      )}

      {rows && (
        <>
          <div className="text-xs text-stone-500">{rows.length} הודעות — בדוק ותקן לפני שמירה{cost != null ? ' · עלות AI: $' + cost.toFixed(4) : ''}</div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {rows.map((r, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-md p-2">
                <div className="text-sm text-stone-800 mb-1 whitespace-pre-wrap">{r.text}</div>
                <div className="flex items-center gap-2">
                  <select value={r.bucket} onChange={(e) => updateRow(i, 'bucket', e.target.value)} className="text-xs px-2 py-1 border border-stone-300 rounded-md bg-white">
                    {BUCKETS.map((b) => (<option key={b.v} value={b.v}>{b.l}</option>))}
                  </select>
                  <select value={r.party} onChange={(e) => updateRow(i, 'party', e.target.value)} className="text-xs px-2 py-1 border border-stone-300 rounded-md bg-white">
                    {PARTIES.map((p) => (<option key={p.v} value={p.v}>{p.l}</option>))}
                  </select>
                  <button onClick={() => removeRow(i)} className="text-xs text-stone-400 hover:text-red-600 mr-auto">🗑️</button>
                </div>
              </div>
            ))}
          </div>
          {projects.length > 0 && (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
              <option value="">— קשר לפרויקט (לא חובה) —</option>
              {projects.map((p) => (<option key={p.id} value={p.id}>{p.title_he}</option>))}
            </select>
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-sm px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50">{saving ? 'שומר...' : '💾 שמור הכל בתיק'}</button>
            <button onClick={() => setRows(null)} disabled={saving} className="text-sm px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-md">מיין מחדש</button>
          </div>
        </>
      )}

      {error && (<div className="text-xs text-red-600">{error}</div>)}
      {savedMsg && (<div className="text-xs text-green-700">{savedMsg}</div>)}
    </div>
  );
}
