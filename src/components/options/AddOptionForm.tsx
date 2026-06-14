'use client';

// src/components/options/AddOptionForm.tsx
// Add a new item to the price-book (options_catalog).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addOption } from '@/lib/options/optionsCatalog';

const CHAPTERS = ['אבזור ומתקנים', 'ברזים', 'תאורה', 'הרחבות אבן', 'גימור'];

export default function AddOptionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [chapter, setChapter] = useState(CHAPTERS[0]);
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [included, setIncluded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) { setError('צריך שם פריט'); return; }
    setError(null); setBusy(true);
    const res = await addOption({
      name_he: name.trim(),
      chapter,
      ales_cost: parseFloat(cost) || 0,
      customer_price: parseFloat(price) || 0,
      included_in_base: included,
    });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setName(''); setCost(''); setPrice(''); setIncluded(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">
        <span>➕</span><span>הוסף פריט למחירון</span>
      </button>
    );
  }

  return (
    <div className="mb-4 bg-white border border-amber-200 rounded-lg p-4" dir="rtl">
      <div className="text-sm font-semibold text-stone-700 mb-3">פריט חדש</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
        <label className="block col-span-2 sm:col-span-1">
          <span className="block text-xs text-stone-500 mb-1">שם הפריט</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        </label>
        <label className="block">
          <span className="block text-xs text-stone-500 mb-1">קטגוריה</span>
          <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
            {CHAPTERS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-stone-500 mb-1">עלות (אלס)</span>
          <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
        </label>
        <label className="block">
          <span className="block text-xs text-stone-500 mb-1">מחיר ללקוח</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer pb-2">
          <input type="checkbox" checked={included} onChange={(e) => setIncluded(e.target.checked)} /> כלול בבסיס
        </label>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={save} disabled={busy} className="px-4 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50">{busy ? '...' : 'שמור'}</button>
        <button onClick={() => { setOpen(false); setError(null); }} className="px-3 py-1.5 text-sm text-stone-500">ביטול</button>
      </div>
      {error && (<div className="text-xs text-red-600 mt-1">{error}</div>)}
    </div>
  );
}
