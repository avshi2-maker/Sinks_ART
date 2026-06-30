'use client';

// src/components/offers/PriceBreaksManager.tsx
// Editable table of Ales turnkey price-breaks (config -> price). Add/edit/archive.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PriceBreakRow } from '@/lib/offers/offerTypes';
import { addPriceBreak, updatePriceBreak, archivePriceBreak } from '@/lib/offers/priceBreaksData';

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }

export default function PriceBreaksManager({ rows }: { rows: PriceBreakRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eLabel, setELabel] = useState(''); const [ePrice, setEPrice] = useState(''); const [eKind, setEKind] = useState('base');
  const [nLabel, setNLabel] = useState(''); const [nPrice, setNPrice] = useState(''); const [nKind, setNKind] = useState('base');

  const inp = 'px-2.5 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white';

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) { setErr(res.error || 'שגיאה'); return; }
      setEditingId(null); setNLabel(''); setNPrice(''); setNKind('base');
      router.refresh();
    });
  }

  return (
    <div dir="rtl">
      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}
      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_110px_90px] gap-2 px-3 py-2 bg-stone-50 text-xs text-stone-500">
          <span>תצורה</span><span className="text-left">מחיר (אלס)</span><span>סוג</span><span></span>
        </div>
        {rows.map((r) => (
          editingId === r.id ? (
            <div key={r.id} className="grid grid-cols-[1fr_120px_110px_90px] gap-2 px-3 py-2 border-t border-stone-100 items-center bg-blue-50">
              <input value={eLabel} onChange={(e) => setELabel(e.target.value)} className={inp} dir="rtl" disabled={isPending} />
              <input value={ePrice} onChange={(e) => setEPrice(e.target.value)} className={inp + ' text-left'} dir="ltr" disabled={isPending} />
              <select value={eKind} onChange={(e) => setEKind(e.target.value)} className={inp} dir="rtl" disabled={isPending}>
                <option value="base">בסיס</option><option value="addon">תוספת</option>
              </select>
              <div className="flex gap-1 justify-end">
                <button onClick={() => run(() => updatePriceBreak(r.id, eLabel, Number(ePrice), eKind))} disabled={isPending} className="text-xs px-2 py-1 bg-blue-600 text-white rounded-md">שמור</button>
                <button onClick={() => setEditingId(null)} disabled={isPending} className="text-xs px-2 py-1 text-stone-500">✕</button>
              </div>
            </div>
          ) : (
            <div key={r.id} className="grid grid-cols-[1fr_120px_110px_90px] gap-2 px-3 py-2.5 border-t border-stone-100 items-center">
              <span className="text-sm text-stone-800">{r.label_he}</span>
              <span className="text-sm text-left">{r.kind === 'addon' ? '+' : ''}{ils(r.price_ils)}</span>
              <span className="text-xs"><span className={'px-1.5 py-0.5 rounded-full ' + (r.kind === 'addon' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600')}>{r.kind === 'addon' ? 'תוספת' : 'בסיס'}</span></span>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setEditingId(r.id); setELabel(r.label_he); setEPrice(String(r.price_ils)); setEKind(r.kind); setErr(null); }} disabled={isPending} className="text-stone-400 hover:text-blue-600 text-xs" title="ערוך">✏️</button>
                <button onClick={() => { if (window.confirm('להעביר לארכיון את "' + r.label_he + '"?')) run(() => archivePriceBreak(r.id)); }} disabled={isPending} className="text-stone-400 hover:text-red-600 text-xs" title="ארכב">📥</button>
              </div>
            </div>
          )
        ))}
        {rows.length === 0 && <div className="px-3 py-6 text-center text-sm text-stone-400 border-t border-stone-100">הטבלה ריקה. הוסיפו תצורה ראשונה.</div>}

        <div className="grid grid-cols-[1fr_120px_110px_90px] gap-2 px-3 py-2.5 border-t border-stone-200 bg-stone-50 items-center">
          <input value={nLabel} onChange={(e) => setNLabel(e.target.value)} placeholder="תצורה חדשה (לדוגמה: 2.5 מטר)" className={inp} dir="rtl" disabled={isPending} />
          <input value={nPrice} onChange={(e) => setNPrice(e.target.value)} placeholder="מחיר" className={inp + ' text-left'} dir="ltr" disabled={isPending} />
          <select value={nKind} onChange={(e) => setNKind(e.target.value)} className={inp} dir="rtl" disabled={isPending}>
            <option value="base">בסיס</option><option value="addon">תוספת</option>
          </select>
          <div className="flex justify-end">
            <button onClick={() => run(() => addPriceBreak(nLabel, Number(nPrice), nKind))} disabled={isPending || !nLabel.trim()} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">+ הוסף</button>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-stone-400 mt-2">"בסיס" = מחיר עצמאי לפי תצורה. "תוספת" = מתווסף לבסיס (לדוגמה: כיור כפול +2,000).</div>
    </div>
  );
}
