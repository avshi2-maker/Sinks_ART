'use client';

// src/components/addons/AddonsManager.tsx
// Manage the add-ons catalog: add (name/category/price), list, delete.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Addon, addAddon, deleteAddon } from '@/lib/addons/addonsData';

export default function AddonsManager({ addons }: { addons: Addon[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);

  async function save() {
    if (!name.trim()) { window.alert('צריך שם פריט'); return; }
    setBusy(true);
    const res = await addAddon(name.trim(), category.trim(), price);
    setBusy(false);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setName(''); setCategory(''); setPrice(0);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm('להסיר את הפריט?')) return;
    await deleteAddon(id);
    router.refresh();
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-stone-700 mb-3">הוסף פריט לקטלוג</div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[200px]">
            <span className="block text-xs font-medium text-stone-600 mb-1">שם הפריט</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="מתקן תליית מגבות" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">קטגוריה</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="אבזור" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">מחיר ברירת מחדל</span>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} className="w-28 px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
          </label>
          <button onClick={save} disabled={busy} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">{busy ? '...' : 'שמור'}</button>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-stone-700 mb-2">{addons.length} פריטים בקטלוג</div>
        <div className="space-y-1">
          {addons.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-md px-3 py-2">
              <div className="text-sm text-stone-800">
                {a.name_he}
                {a.category && <span className="text-xs text-stone-400 mr-2"> · {a.category}</span>}
              </div>
              <div className="flex items-center gap-3">
                {a.default_price_ils > 0 && <span className="text-sm text-stone-600">₪{a.default_price_ils.toLocaleString('he-IL')}</span>}
                <button onClick={() => remove(a.id)} className="text-xs text-red-500 hover:underline">הסר</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
