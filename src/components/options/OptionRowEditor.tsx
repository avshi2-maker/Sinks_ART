'use client';

// src/components/options/OptionRowEditor.tsx
// Phase 28 — one editable price-book row (cost, customer price, remark, active).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveOption, deleteOption, OptionRow } from '@/lib/options/optionsCatalog';

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }

export default function OptionRowEditor({ row }: { row: OptionRow }) {
  const [cost, setCost] = useState(String(row.ales_cost ?? 0));
  const [price, setPrice] = useState(String(row.customer_price ?? 0));
  const [note, setNote] = useState(row.note_he ?? '');
  const [active, setActive] = useState(row.active);
  const [included, setIncluded] = useState(row.included_in_base ?? false);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const margin = (parseFloat(price) || 0) - (parseFloat(cost) || 0);

  async function handleSave() {
    setError(null); setSaved(false); setSaving(true);
    const res = await saveOption({
      id: row.id,
      ales_cost: parseFloat(cost) || 0,
      customer_price: parseFloat(price) || 0,
      note_he: note,
      active,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setSaved(true);
        setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    if (!window.confirm('למחוק את הפריט "' + row.name_he + '" מהמחירון?')) return;
    const res = await deleteOption(row.id);
    if (!res.ok) { setError(res.error || 'מחיקה נכשלה'); return; }
    router.refresh();
  }

  return (
    <div className={active ? 'border border-stone-200 rounded-lg p-3 bg-white' : 'border border-stone-200 rounded-lg p-3 bg-stone-50 opacity-70'} dir="rtl">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-stone-800">{row.name_he}</span>
        <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          פעיל
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer"><input type="checkbox" checked={included} onChange={(e) => setIncluded(e.target.checked)} /> כלול בבסיס</label>
        <button onClick={handleDelete} className="text-xs text-red-500 hover:underline">מחק</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-stone-500 mb-1">עלות (אלס)</label>
          <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-amber-400" dir="ltr" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">מחיר ללקוח</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-amber-400" dir="ltr" />
        </div>
        <div className="text-xs">
          <span className="block text-stone-500 mb-1">מרווח</span>
          <span className={margin > 0 ? 'text-green-700 font-medium' : 'text-stone-400'}>{ils(margin)}</span>
        </div>
        <div>
          <button onClick={handleSave} disabled={saving} className={saved ? 'w-full px-3 py-1.5 text-sm rounded-md bg-green-600 text-white' : 'w-full px-3 py-1.5 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'}>
            {saving ? '...' : saved ? '✓ נשמר' : 'שמור'}
          </button>
        </div>
      </div>
      <div className="mt-2">
        <label className="block text-xs text-stone-500 mb-1">הערה (לדוגמה: צריך חשמלאי לחיבור סופי)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-amber-400" dir="rtl" />
      </div>
      {error && (<div className="text-xs text-red-600 mt-1">{error}</div>)}
    </div>
  );
}
