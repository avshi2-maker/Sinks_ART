'use client';

// src/components/offers/OfferBuilder.tsx
// The price-offer cockpit: pick Ales base (from price-breaks) + component lines +
// markup (% or fixed) = commission. Live total. Save to quotes (-> ROI) + copy text.

import { useState, useMemo, useTransition } from 'react';
import type { PriceBreakRow } from '@/lib/offers/offerTypes';
import { saveOffer } from '@/lib/offers/saveOffer';

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }

interface CompLine { id: number; label: string; price: string; }

export default function OfferBuilder({ breaks }: { breaks: PriceBreakRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // who / what
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');

  // 1) base from price-breaks (multi-select of addon-kind, single base)
  const [baseId, setBaseId] = useState<string>('');
  const [pickedAddons, setPickedAddons] = useState<string[]>([]);
  const [baseManual, setBaseManual] = useState('');

  const bases = breaks.filter((b) => b.kind === 'base');
  const addons = breaks.filter((b) => b.kind === 'addon');

  const baseFromPicks = useMemo(() => {
    const b = bases.find((x) => x.id === baseId)?.price_ils || 0;
    const a = addons.filter((x) => pickedAddons.includes(x.id)).reduce((s, x) => s + x.price_ils, 0);
    return b + a;
  }, [baseId, pickedAddons, bases, addons]);

  const base = baseManual.trim() ? Number(baseManual) || 0 : baseFromPicks;

  // 2) component lines
  const [lines, setLines] = useState<CompLine[]>([
    { id: 1, label: 'לוחות פורצלן / שיש', price: '' },
    { id: 2, label: 'התקנה באתר', price: '' },
  ]);
  const compTotal = lines.reduce((s, l) => s + (Number(l.price) || 0), 0);

  // 3) markup = commission
  const [mkMode, setMkMode] = useState<'pct' | 'fixed'>('pct');
  const [mkPct, setMkPct] = useState('20');
  const [mkFixed, setMkFixed] = useState('');

  const costBeforeMarkup = base + compTotal;                      // total_cost
  const commission = mkMode === 'pct'
    ? Math.round(costBeforeMarkup * (Number(mkPct) || 0) / 100)
    : Math.round(Number(mkFixed) || 0);                            // total_margin
  const grand = costBeforeMarkup + commission;                    // total_grand

  function setLine(id: number, k: 'label' | 'price', v: string) {
    setLines((ls) => ls.map((l) => l.id === id ? { ...l, [k]: v } : l));
  }
  function addLine() { setLines((ls) => [...ls, { id: Date.now(), label: '', price: '' }]); }
  function delLine(id: number) { setLines((ls) => ls.filter((l) => l.id !== id)); }

  const summaryText = useMemo(() => {
    const parts: string[] = [];
    if (title) parts.push(title);
    if (customerName) parts.push('לקוח: ' + customerName);
    parts.push('');
    const baseLabel = baseManual.trim() ? 'עבודה (אלס)' :
      [bases.find((x) => x.id === baseId)?.label_he, ...addons.filter((x) => pickedAddons.includes(x.id)).map((x) => x.label_he)].filter(Boolean).join(' + ');
    if (base > 0) parts.push('עבודה' + (baseLabel ? ' (' + baseLabel + ')' : '') + ': ' + ils(base));
    lines.filter((l) => Number(l.price) > 0).forEach((l) => parts.push((l.label || 'פריט') + ': ' + ils(Number(l.price))));
    parts.push('');
    parts.push('סה"כ לפני עמלה: ' + ils(costBeforeMarkup));
    parts.push('סה"כ לתשלום: ' + ils(grand));
    return parts.join('\n');
  }, [title, customerName, baseManual, baseId, pickedAddons, base, lines, costBeforeMarkup, grand, bases, addons]);

  function doCopy() {
    navigator.clipboard.writeText(summaryText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function doSave() {
    setErr(null); setSavedMsg(null);
    startTransition(async () => {
      const res = await saveOffer({ customerName: customerName || null, title: title || 'הצעת מחיר', cost: costBeforeMarkup, commission, summaryText });
      if (!res.ok) { setErr(res.error || 'שגיאה בשמירה'); return; }
      setSavedMsg('נשמר ✓ ' + (res.quoteNumber || '') + ' — העמלה תופיע ב-ROI');
    });
  }

  const inp = 'px-2.5 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white w-full';
  const card = 'bg-white border border-stone-200 rounded-lg p-4 mb-3';

  return (
    <div dir="rtl">
      {/* who / what */}
      <div className={card}>
        <div className="grid grid-cols-2 gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת ההצעה (לדוגמה: כיור 2.70)" className={inp} dir="rtl" />
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="שם לקוח" className={inp} dir="rtl" />
        </div>
      </div>

      {/* 1) base */}
      <div className={card}>
        <div className="text-sm text-blue-700 mb-2">1 · בסיס — עבודה מאלס (כולל מע"מ)</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {bases.map((b) => (
            <button key={b.id} onClick={() => { setBaseId(b.id === baseId ? '' : b.id); setBaseManual(''); }}
              className={'text-xs px-3 py-1.5 rounded-full border ' + (baseId === b.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-700 border-stone-300')}>
              {b.label_he} · {ils(b.price_ils)}
            </button>
          ))}
        </div>
        {addons.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {addons.map((a) => (
              <button key={a.id} onClick={() => { setPickedAddons((p) => p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]); setBaseManual(''); }}
                className={'text-xs px-3 py-1.5 rounded-full border ' + (pickedAddons.includes(a.id) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-700 border-stone-300')}>
                + {a.label_he} · {ils(a.price_ils)}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">או ידני:</span>
          <input value={baseManual} onChange={(e) => setBaseManual(e.target.value)} placeholder="מחיר אלס ידני" className={inp + ' max-w-[160px] text-left'} dir="ltr" />
          <span className="text-sm text-stone-600 mr-auto">בסיס: <strong>{ils(base)}</strong></span>
        </div>
      </div>

      {/* 2) components */}
      <div className={card}>
        <div className="text-sm text-stone-600 mb-2">2 · רכיבים — חומרים, התקנה, תוספות</div>
        {lines.map((l) => (
          <div key={l.id} className="grid grid-cols-[1fr_120px_32px] gap-2 mb-2 items-center">
            <input value={l.label} onChange={(e) => setLine(l.id, 'label', e.target.value)} placeholder="שם פריט" className={inp} dir="rtl" />
            <input value={l.price} onChange={(e) => setLine(l.id, 'price', e.target.value)} placeholder="מחיר" className={inp + ' text-left'} dir="ltr" />
            <button onClick={() => delLine(l.id)} className="text-stone-400 hover:text-red-600 text-sm" title="הסר">✕</button>
          </div>
        ))}
        <button onClick={addLine} className="text-xs px-3 py-1.5 border border-stone-300 rounded-md text-stone-600 hover:bg-stone-50">+ שורה</button>
        <span className="text-sm text-stone-600 mr-3">רכיבים: <strong>{ils(compTotal)}</strong></span>
      </div>

      {/* 3) markup */}
      <div className={card}>
        <div className="text-sm text-amber-700 mb-2">3 · עמלה (מרקאפ)</div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" checked={mkMode === 'pct'} onChange={() => setMkMode('pct')} /> אחוז
            <input value={mkPct} onChange={(e) => setMkPct(e.target.value)} disabled={mkMode !== 'pct'} className={inp + ' w-16 text-center'} dir="ltr" /> %
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" checked={mkMode === 'fixed'} onChange={() => setMkMode('fixed')} /> סכום קבוע
            <input value={mkFixed} onChange={(e) => setMkFixed(e.target.value)} disabled={mkMode !== 'fixed'} placeholder="₪" className={inp + ' w-24 text-left'} dir="ltr" />
          </label>
          <span className="text-sm text-amber-700 mr-auto">עמלה: <strong>{ils(commission)}</strong></span>
        </div>
      </div>

      {/* total */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-3">
        <div className="flex justify-between text-sm text-stone-600 py-0.5"><span>בסיס + רכיבים</span><span>{ils(costBeforeMarkup)}</span></div>
        <div className="flex justify-between text-sm text-amber-700 py-0.5"><span>עמלה{mkMode === 'pct' ? ' (' + (Number(mkPct) || 0) + '%)' : ''}</span><span>{ils(commission)}</span></div>
        <div className="flex justify-between text-lg font-semibold text-stone-900 pt-1.5 border-t border-stone-200 mt-1"><span>סה"כ ללקוח</span><span>{ils(grand)}</span></div>
      </div>

      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}
      {savedMsg && <div className="text-xs text-green-700 mb-2">{savedMsg}</div>}

      <div className="flex gap-2">
        <button onClick={doCopy} className="text-sm px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50">{copied ? 'הועתק ✓' : '📋 העתק טקסט'}</button>
        <button onClick={doSave} disabled={isPending || grand <= 0} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{isPending ? 'שומר…' : '💾 שמור הצעה'}</button>
      </div>

      {/* live text preview */}
      <div className="mt-3">
        <div className="text-xs text-stone-400 mb-1">תצוגה מקדימה (מועתק / נשמר):</div>
        <pre className="bg-white border border-stone-200 rounded-lg p-3 text-sm text-stone-800 whitespace-pre-wrap font-sans">{summaryText}</pre>
      </div>
    </div>
  );
}
