'use client';

// src/components/sorter/DraftOfferBuilder.tsx
// Phase 30 — build a draft price offer from correspondence (saved + pasted).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPriceMessages, saveDraftOffer, DraftLine } from '@/lib/sorter/draftOffer';

interface ProjectLite { id: string; title_he: string | null; }
interface Props { customerId: string; customerName: string | null; projects?: ProjectLite[]; }

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }

export default function DraftOfferBuilder({ customerId, customerName, projects = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [extra, setExtra] = useState('');
  const [lines, setLines] = useState<DraftLine[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function handleExtract() {
    setError(null); setSavedMsg(null); setBusy(true);
    try {
      const saved = await fetchPriceMessages(customerId, projectId || null);
      const combined = [saved, extra.trim()].filter(Boolean).join('\n');
      if (!combined.trim()) { setError('אין טקסט לחילוץ — אין הודעות מחיר שמורות, ולא הודבק טקסט'); setBusy(false); return; }
      const res = await fetch('/api/extract-items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: combined }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'חילוץ נכשל'); setBusy(false); return; }
      setLines(data.items as DraftLine[]);
      setCost(typeof data.apiCostUsd === 'number' ? data.apiCostUsd : null);
    } catch (e) {
      setError('שגיאת רשת: ' + (e instanceof Error ? e.message : String(e)));
    }
    setBusy(false);
  }

  function updateLine(i: number, field: keyof DraftLine, value: string) {
    if (!lines) return;
    const next = [...lines];
    next[i] = { ...next[i], [field]: field === 'price' ? (parseFloat(value) || 0) : value };
    setLines(next);
  }
  function removeLine(i: number) { if (lines) setLines(lines.filter((_, idx) => idx !== i)); }
  function addLine() { setLines([...(lines || []), { item: '', price: 0, remark: '' }]); }

  const total = (lines || []).reduce((s, l) => s + (Number(l.price) || 0), 0);

  async function handleSave() {
    if (!lines || lines.length === 0) return;
    setSaving(true); setError(null);
    const res = await saveDraftOffer({ customerId, customerName, projectId: projectId || null, lines });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setSavedMsg('נשמרה טיוטת הצעה ' + (res.quoteNumber || '') + ' ✓');
    setLines(null); setExtra(''); setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-sm text-teal-700 hover:bg-teal-50 py-2 mb-4 rounded-md border border-dashed border-teal-300 hover:border-teal-400 transition-colors">
        🧾 בנה טיוטת הצעה מהתכתובת (AI)
      </button>
    );
  }

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 space-y-2" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-800">🧾 טיוטת הצעה מהתכתובת</span>
        <button onClick={() => { setOpen(false); setLines(null); setError(null); }} className="text-xs text-stone-500 hover:text-stone-700">סגור</button>
      </div>

      {!lines && (
        <>
          {projects.length > 0 && (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
              <option value="">— כל ההודעות (ללא סינון פרויקט) —</option>
              {projects.map((p) => (<option key={p.id} value={p.id}>{p.title_he}</option>))}
            </select>
          )}
          <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={4} placeholder="(לא חובה) הדבק כאן מחירים נוספים שלא נשמרו בתיק..." className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-teal-400 bg-white resize-y" dir="rtl" disabled={busy} />
          <div className="text-xs text-stone-500">ימשוך הודעות 💰 מחיר + 🎨 אפשרויות השמורות בתיק, יחד עם מה שתדביק כאן.</div>
          <button onClick={handleExtract} disabled={busy} className="text-sm px-4 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50">{busy ? 'מחלץ...' : '✨ חלץ פריטים'}</button>
        </>
      )}

      {lines && (
        <>
          <div className="text-xs text-stone-500">{lines.length} פריטים — ערוך לפני שמירה{cost != null ? ' · עלות AI: $' + cost.toFixed(4) : ''}</div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {lines.map((l, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-md p-2 flex items-center gap-2">
                <input value={l.item} onChange={(e) => updateLine(i, 'item', e.target.value)} placeholder="פריט" className="flex-1 px-2 py-1 text-sm border border-stone-300 rounded-md" dir="rtl" />
                <input value={String(l.price)} onChange={(e) => updateLine(i, 'price', e.target.value)} inputMode="decimal" placeholder="₪" className="w-24 px-2 py-1 text-sm border border-stone-300 rounded-md" dir="ltr" />
                <input value={l.remark} onChange={(e) => updateLine(i, 'remark', e.target.value)} placeholder="הערה" className="flex-1 px-2 py-1 text-sm border border-stone-300 rounded-md" dir="rtl" />
                <button onClick={() => removeLine(i)} className="text-xs text-stone-400 hover:text-red-600">🗑️</button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button onClick={addLine} className="text-xs text-teal-700 hover:underline">+ הוסף שורה</button>
            <span className="text-sm text-stone-700">סה"כ: <strong>{ils(total)}</strong></span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-sm px-4 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50">{saving ? 'שומר...' : '💾 שמור טיוטת הצעה'}</button>
            <button onClick={() => setLines(null)} disabled={saving} className="text-sm px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-md">חלץ מחדש</button>
          </div>
        </>
      )}

      {error && (<div className="text-xs text-red-600">{error}</div>)}
      {savedMsg && (<div className="text-xs text-green-700">{savedMsg}</div>)}
    </div>
  );
}
