'use client';

// src/components/doors/DoorOfferLine.tsx
// Phase 37 Step 4B — build a door offer line-item: pick stone + size + handle + qty,
// computeDoorPrice (size-aware), produce a ready-to-paste Hebrew offer line for the
// ARVO offer, with an optional spec-PDF link appended.

import { useState } from 'react';
import type { DoorStone } from '@/lib/doors/doorCatalogTypes';
import { HANDLE_OPTIONS, computeDoorPrice } from '@/lib/doors/doorCatalogTypes';

const INP = 'px-2 py-1.5 text-sm border border-stone-300 rounded-md';

export default function DoorOfferLine({ stones }: { stones: DoorStone[] }) {
  const active = stones.filter((s) => s.is_active);
  const [stoneId, setStoneId] = useState(active[0]?.id || '');
  const [w, setW] = useState('1500');
  const [h, setH] = useState('2000');
  const [handleId, setHandleId] = useState(HANDLE_OPTIONS[0].id);
  const [qty, setQty] = useState('1');
  const [specUrl, setSpecUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (active.length === 0) {
    return (<div className="bg-white border border-stone-200 rounded-lg p-4 text-sm text-stone-500" dir="rtl">אין אבנים פעילות בקטלוג. הוסיפו או הפעילו אבן למעלה כדי לבנות שורת הצעה.</div>);
  }

  const stone = active.find((s) => s.id === stoneId) || active[0];
  const handle = HANDLE_OPTIONS.find((x) => x.id === handleId) || HANDLE_OPTIONS[0];
  const wNum = Number(w) || 0;
  const hNum = Number(h) || 0;
  const q = Math.max(1, Number(qty) || 1);
  const total = computeDoorPrice({ basePriceIls: stone.base_price_ils, pricePerSqmIls: stone.price_per_sqm_ils, widthMm: wNum, heightMm: hNum, handleAdderIls: handle.adder_ils, qty: q });
  const line = 'דלת שיש בגובה אפס · ' + stone.name_he + ' · ' + wNum + '×' + hNum + ' מ"מ · ' + handle.name_he + ' · כמות ' + q + ' — ₪' + total.toLocaleString('he-IL') + ' כולל מע"מ' + (specUrl.trim() ? ('\nמפרט טכני מצורף: ' + specUrl.trim()) : '');

  async function copy() {
    try { await navigator.clipboard.writeText(line); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { window.alert('העתקה נכשלה — סמנו את הטקסט והעתיקו ידנית.'); }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4" dir="rtl">
      <div className="text-sm font-semibold text-stone-700 mb-3">בונה שורת הצעה — דלת</div>
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <label className="text-xs text-stone-500">אבן<select value={stoneId} onChange={(e) => setStoneId(e.target.value)} className={INP + ' block mt-1'} dir="rtl">{active.map((s) => (<option key={s.id} value={s.id}>{s.name_he}</option>))}</select></label>
        <label className="text-xs text-stone-500">רוחב<input value={w} onChange={(e) => setW(e.target.value.replace(/[^\d]/g, ''))} className={INP + ' block mt-1 w-24'} dir="ltr" /></label>
        <label className="text-xs text-stone-500">גובה<input value={h} onChange={(e) => setH(e.target.value.replace(/[^\d]/g, ''))} className={INP + ' block mt-1 w-24'} dir="ltr" /></label>
        <label className="text-xs text-stone-500">ידית<select value={handleId} onChange={(e) => setHandleId(e.target.value)} className={INP + ' block mt-1'} dir="rtl">{HANDLE_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.name_he}</option>))}</select></label>
        <label className="text-xs text-stone-500">כמות<input value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ''))} className={INP + ' block mt-1 w-16'} dir="ltr" /></label>
      </div>
      <label className="block text-xs text-stone-500 mb-3">קישור מפרט PDF (לא חובה)<input value={specUrl} onChange={(e) => setSpecUrl(e.target.value)} placeholder="https://res.cloudinary.com/.../door-spec.pdf" className={INP + ' block mt-1 w-full'} dir="ltr" /></label>
      <div className="bg-stone-50 border border-stone-200 rounded-md p-3 mb-3">
        <div className="text-[11px] text-stone-400 mb-1">תצוגה מקדימה (להעתקה להצעת ARVO)</div>
        <div className="text-sm text-stone-800 whitespace-pre-wrap">{line}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={copy} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">{copied ? 'הועתק ✓' : 'העתק שורה'}</button>
          <a href="/arvo-offer" className="text-sm text-blue-600 hover:underline">פתח הצעת ARVO ←</a>
        </div>
        <span className="text-lg font-semibold text-stone-900">₪{total.toLocaleString('he-IL')}</span>
      </div>
    </div>
  );
}
