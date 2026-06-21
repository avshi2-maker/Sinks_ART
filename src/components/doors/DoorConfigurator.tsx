'use client';

// src/components/doors/DoorConfigurator.tsx
// Phase 37 Step 3 (+3b live feedback) — public flush-to-zero door configurator.
// Stone swatch -> render swap, H×W size inputs with live area + range clamp,
// preferred handle (carried into the quote), live summary, WhatsApp quote request.

import { useState } from 'react';
import type { DoorStone } from '@/lib/doors/doorCatalogTypes';
import { HANDLE_OPTIONS } from '@/lib/doors/doorCatalogTypes';

const BENEFITS = ['סף אפס — ללא מדרגה', 'ללא משקוף נראה', 'חיפוי שיש רציף', 'מנעול רב-בריח נסתר', 'סגירה נסתרת בריצפה'];
const WA = process.env.NEXT_PUBLIC_WA_NUMBER || '972505231042';
const W_MIN = 900, W_MAX = 1800, H_MIN = 1800, H_MAX = 2600;

function clamp(n: number, min: number, max: number): number { return Math.min(max, Math.max(min, n)); }

export default function DoorConfigurator({ stones }: { stones: DoorStone[] }) {
  const [idx, setIdx] = useState(0);
  const [w, setW] = useState('1500');
  const [h, setH] = useState('2000');
  const [handle, setHandle] = useState<string>('');

  if (stones.length === 0) {
    return (<div className="text-center text-stone-500 py-10">הקטלוג בהכנה.</div>);
  }
  const stone = stones[Math.min(idx, stones.length - 1)];

  const wNum = clamp(parseInt(w) || W_MIN, W_MIN, W_MAX);
  const hNum = clamp(parseInt(h) || H_MIN, H_MIN, H_MAX);
  const areaSqm = ((wNum / 1000) * (hNum / 1000)).toFixed(1);
  const wBad = w !== '' && (parseInt(w) < W_MIN || parseInt(w) > W_MAX);
  const hBad = h !== '' && (parseInt(h) < H_MIN || parseInt(h) > H_MAX);
  const handleName = handle ? (HANDLE_OPTIONS.find((x) => x.id === handle)?.name_he || 'לא נבחרה') : 'לא נבחרה';
  const summary = 'דלת בגובה אפס · ' + stone.name_he + ' · ' + wNum + ' × ' + hNum + ' מ"מ · ' + areaSqm + ' מ"ר · ידית: ' + handleName;

  function requestQuote() {
    const msg = 'שלום, אשמח להצעת מחיר לדלת בגובה אפס:\n' + 'אבן: ' + stone.name_he + '\n' + 'מידה: ' + wNum + ' × ' + hNum + ' מ"מ (' + areaSqm + ' מ"ר)\n' + 'ידית מועדפת: ' + handleName;
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
          <div className="text-xs text-stone-500">דלת בגובה אפס · {wNum} × {hNum} מ"מ · {areaSqm} מ"ר</div>
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
        <div className="flex items-center gap-3 mb-1">
          <label className="flex items-center gap-2 text-sm text-stone-600">רוחב<input value={w} onChange={(e) => setW(e.target.value.replace(/[^\d]/g, ''))} onBlur={() => setW(String(wNum))} inputMode="numeric" className="w-20 px-2 py-1.5 border border-stone-300 rounded-md text-center" /></label>
          <span className="text-stone-400">×</span>
          <label className="flex items-center gap-2 text-sm text-stone-600">גובה<input value={h} onChange={(e) => setH(e.target.value.replace(/[^\d]/g, ''))} onBlur={() => setH(String(hNum))} inputMode="numeric" className="w-20 px-2 py-1.5 border border-stone-300 rounded-md text-center" /></label>
          <span className="text-sm font-medium text-stone-700">{areaSqm} מ"ר</span>
        </div>
        <div className={'text-[11px] mb-5 ' + (wBad || hBad ? 'text-amber-700' : 'text-stone-400')}>טווח: רוחב {W_MIN}–{W_MAX} · גובה {H_MIN}–{H_MAX} מ"מ</div>

        <div className="text-sm text-stone-600 mb-2">ידית מועדפת (לא חובה)</div>
        <div className="flex flex-wrap gap-2 mb-1">
          {HANDLE_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => setHandle(handle === opt.id ? '' : opt.id)} className={'text-xs px-3 py-1.5 rounded-md border ' + (handle === opt.id ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-stone-300 text-stone-600')}>{opt.name_he}</button>))}
        </div>
        <div className="text-[11px] text-stone-400 mb-5">הבחירה נכללת בבקשת ההצעה לתמחור מדויק.</div>

        <div className="flex flex-wrap gap-2 mb-5">
          {BENEFITS.map((b) => (<span key={b} className="text-[11px] px-2 py-1 rounded-full bg-stone-100 text-stone-600">{b}</span>))}
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-600 mb-3">{summary}</div>

        <button onClick={requestQuote} className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-3 text-base font-medium">בקשת הצעה ב-WhatsApp</button>
      </div>
    </div>
  );
}
