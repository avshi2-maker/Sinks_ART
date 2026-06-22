'use client';

// src/components/doors/DoorsManager.tsx
// Phase 37 Step 4A — door catalog editor. Each stone is an editable card
// (name, swatch, render URL, base price, per-m², sort, active) + an add-stone card.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertDoorStone, deleteDoorStone } from '@/lib/doors/doorCatalogData';
import type { DoorStone } from '@/lib/doors/doorCatalogTypes';

const INP = 'w-full px-2 py-1 text-sm border border-stone-300 rounded-md';

function StoneRow({ stone }: { stone: DoorStone }) {
  const router = useRouter();
  const [name, setName] = useState(stone.name_he);
  const [swatch, setSwatch] = useState(stone.swatch_hex);
  const [render, setRender] = useState(stone.render_url || '');
  const [base, setBase] = useState(String(stone.base_price_ils));
  const [perSqm, setPerSqm] = useState(String(stone.price_per_sqm_ils));
  const [sort, setSort] = useState(String(stone.sort_order));
  const [active, setActive] = useState(stone.is_active);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await upsertDoorStone({ id: stone.id, stone_id: stone.stone_id, name_he: name, swatch_hex: swatch, render_url: render || null, base_price_ils: Number(base) || 0, price_per_sqm_ils: Number(perSqm) || 0, sort_order: Number(sort) || 0, is_active: active });
    setBusy(false);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }
  async function remove() {
    if (!window.confirm('להסיר את האבן ' + stone.name_he + '?')) return;
    const res = await deleteDoorStone(stone.id);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <div className={'bg-white border rounded-lg p-3 flex gap-3 ' + (active ? 'border-stone-200' : 'border-stone-200 opacity-60')}>
      <div className="shrink-0 w-12 h-16 rounded border border-stone-200 overflow-hidden flex items-center justify-center" style={{ backgroundColor: swatch }}>
        {render ? (<img src={render} alt={name} className="w-full h-full object-cover" />) : null}
      </div>
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="text-xs text-stone-500">שם<input value={name} onChange={(e) => setName(e.target.value)} className={INP} dir="rtl" /></label>
        <label className="text-xs text-stone-500">גוון (hex)<input value={swatch} onChange={(e) => setSwatch(e.target.value)} className={INP} dir="ltr" /></label>
        <label className="text-xs text-stone-500">מיון<input value={sort} onChange={(e) => setSort(e.target.value.replace(/[^\d]/g, ''))} className={INP} dir="ltr" /></label>
        <label className="text-xs text-stone-500 col-span-2 sm:col-span-3">קישור רינדור (URL)<input value={render} onChange={(e) => setRender(e.target.value)} placeholder="https://res.cloudinary.com/..." className={INP} dir="ltr" /></label>
        <label className="text-xs text-stone-500">מחיר בסיס ₪<input value={base} onChange={(e) => setBase(e.target.value.replace(/[^\d.]/g, ''))} className={INP} dir="ltr" /></label>
        <label className="text-xs text-stone-500">₪ למ"ר נוסף<input value={perSqm} onChange={(e) => setPerSqm(e.target.value.replace(/[^\d.]/g, ''))} className={INP} dir="ltr" /></label>
        <label className="text-xs text-stone-500 flex items-center gap-1.5 self-end pb-1"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />פעיל באתר</label>
      </div>
      <div className="shrink-0 flex flex-col gap-2">
        <button onClick={save} disabled={busy} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">{busy ? '...' : 'שמור'}</button>
        <button onClick={remove} className="px-3 py-1.5 text-xs text-red-500 hover:underline">הסר</button>
      </div>
    </div>
  );
}

function AddStone() {
  const router = useRouter();
  const [sid, setSid] = useState('');
  const [name, setName] = useState('');
  const [swatch, setSwatch] = useState('#CCCCCC');
  const [sort, setSort] = useState('10');
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!sid.trim() || !name.trim()) { window.alert('צריך מזהה (אנגלית) ושם'); return; }
    setBusy(true);
    const res = await upsertDoorStone({ stone_id: sid.trim(), name_he: name.trim(), swatch_hex: swatch, sort_order: Number(sort) || 0 });
    setBusy(false);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setSid(''); setName(''); setSwatch('#CCCCCC'); setSort('10');
    router.refresh();
  }
  return (
    <div className="bg-stone-50 border border-dashed border-stone-300 rounded-lg p-3">
      <div className="text-xs font-semibold text-stone-600 mb-2">הוסף אבן חדשה</div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-stone-500">מזהה (אנגלית)<input value={sid} onChange={(e) => setSid(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="travertine" className={INP + ' w-32'} dir="ltr" /></label>
        <label className="text-xs text-stone-500">שם<input value={name} onChange={(e) => setName(e.target.value)} placeholder="טרוורטין" className={INP + ' w-32'} dir="rtl" /></label>
        <label className="text-xs text-stone-500">גוון (hex)<input value={swatch} onChange={(e) => setSwatch(e.target.value)} className={INP + ' w-28'} dir="ltr" /></label>
        <label className="text-xs text-stone-500">מיון<input value={sort} onChange={(e) => setSort(e.target.value.replace(/[^\d]/g, ''))} className={INP + ' w-16'} dir="ltr" /></label>
        <button onClick={add} disabled={busy} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">{busy ? '...' : 'הוסף'}</button>
      </div>
      <div className="text-[11px] text-stone-400 mt-2">לאחר ההוספה — הדביקו URL רינדור והגדירו מחירים בכרטיס שייווצר.</div>
    </div>
  );
}

export default function DoorsManager({ stones }: { stones: DoorStone[] }) {
  return (
    <div dir="rtl" className="space-y-3">
      <div className="text-sm font-semibold text-stone-700">{stones.length} אבנים בקטלוג</div>
      {stones.map((s) => (<StoneRow key={s.id} stone={s} />))}
      <AddStone />
    </div>
  );
}
