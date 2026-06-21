'use client';

// src/components/doors/DoorConfigurator.tsx
// Phase 37 Step 3 — public flush-to-zero door configurator.
// Stone swatch -> render swap, H×W size inputs, preferred handle (non-binding),
// benefit strip, "בקשת הצעה" -> WhatsApp to the business with a structured summary.

import { useState } from 'react';
import type { DoorStone } from '@/lib/doors/doorCatalogTypes';
import { HANDLE_OPTIONS } from '@/lib/doors/doorCatalogTypes';

const BENEFITS = ['סף אפס — ללא מדרגה', 'ללא משקוף נראה', 'חיפוי שיש רציף', 'מנעול רב-בריח נסתר', 'סגירה נסתרת בריצפה'];
const WA = process.env.NEXT_PUBLIC_WA_NUMBER || '972505231042';

export default function DoorConfigurator({ stones }: { stones: DoorStone[] }) {
  const [idx, setIdx] = useState(0);
  const [w, setW] = useState('1500');
  const [h, setH] = useState('2000');
  const [handle, setHandle] = useState<string>('');

  if (stones.length === 0) {
    return (<div className="text-center text-stone-500 py-10">הקטלוג בהכנה.</div>);
  }
  const stone = stones[Math.min(idx, stones.length - 1)];

  function requestQuote() {
    const handleName = handle ? (HANDLE_OPTIONS.find((x) => x.id === handle)?.name_he || 'לא צוין') : 'לא צוין';
    const msg = 'שלום, אשמח להצעת מחיר לדלת בגובה אפס:\n' + 'אבן: ' + stone.name_he + '\n' + 'מידה: ' + (w || '—') + ' × ' + (h || '—') + ' מ"מ\n' + 'ידית מועדפת: ' + handleName;
    window.open('https://api.whatsapp.com/send?phone=' + WA + '&text=' + encodeURIComponent(msg), '_blank');
  }

  return (
    <div dir="rtl" className="grid md:grid-cols-2 gap-6 items-start">
      <div>
        <div className="bg-stone-50 rounded-2xl p-4 flex items-center justify-center">
          <div className="relative w-full max-w-[300px] aspect-[2/3] rounded-lg overflow-hidden border border-stone-200" style={{ backgroundColor: stone.swatch_hex }}>
            {stone.render_url ? (<img src={stone.render_url} alt={stone.name_he} className="w-full h-full object-cover" />) : null}
          </div>
        </div>
        <div className="text-center mt-3">
          <div className="text-lg font-medium text-stone-900">{stone.name_he}</div>
          <div className="text-xs text-stone-500">דלת בגובה אפס · חיפוי שיש רציף</div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-stone-900 mb-1">דלת שיש בגובה אפס</h1>
        <p className="text-sm text-stone-600 mb-4">דלת יוקרה חבויה — שיש רציף מהקיר לדלת, ללא משקוף וללא מדרגה. בחרו גוון, מידה וידית מועדפת.</p>

        <div className="text-sm text-stone-600 mb-2">גוון אבן</div>
        <div className="flex gap-3 mb-5">
          {stones.map((s, i) => (<button key={s.id} onClick={() => setIdx(i)} aria-label={s.name_he} className={'w-9 h-9 rounded-full border ' + (i === idx ? 'ring-2 ring-amber-500 border-stone-300' : 'border-stone-300')} style={{ backgroundColor: s.swatch_hex }} />))}
        </div>

        <div className="text-sm text-stone-600 mb-2">מידה (מ&quot;מ)</div>
        <div className="flex items-center gap-3 mb-5">
          <label className="flex items-center gap-2 text-sm text-stone-600">רוחב<input value={w} onChange={(e) => setW(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" className="w-20 px-2 py-1.5 border border-stone-300 rounded-md text-center" /></label>
          <span className="text-stone-400">×</span>
          <label className="flex items-center gap-2 text-sm text-stone-600">גובה<input value={h} onChange={(e) => setH(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" className="w-20 px-2 py-1.5 border border-stone-300 rounded-md text-center" /></label>
        </div>

        <div className="text-sm text-stone-600 mb-2">ידית מועדפת (לא מחייב)</div>
        <div className="flex flex-wrap gap-2 mb-5">
          {HANDLE_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => setHandle(handle === opt.id ? '' : opt.id)} className={'text-xs px-3 py-1.5 rounded-md border ' + (handle === opt.id ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-stone-300 text-stone-600')}>{opt.name_he}</button>))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {BENEFITS.map((b) => (<span key={b} className="text-[11px] px-2 py-1 rounded-full bg-stone-100 text-stone-600">{b}</span>))}
        </div>

        <button onClick={requestQuote} className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-3 text-base font-medium">בקשת הצעה ב-WhatsApp</button>
      </div>
    </div>
  );
}
