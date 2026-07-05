'use client';

// src/components/pricing/PricingEngine.tsx
// THE ENGINE core — sketch to full price picture, live. TWO COST MODES (dayRate / lumpSum).
// COMMISSION editable per job: % (default from settings) or fixed ₪ (e.g. Ziv 213 flat 1,000).
// Chain: trueCost -> +commission (XYZ) -> +premium (UVW) -> split -> save actions.

import { useState, useMemo, useEffect } from 'react';
import { calcMaterial, type MaterialSettings, type MaterialFactors } from '@/lib/offers/materialCalc';
import { sketchSpecToDims } from '@/lib/po/sketchSpecToDims';
import { calcPricing, type CommissionMode } from '@/lib/pricing/alesCostCalc';
import { createWorkOrderFromSketch } from '@/lib/po/createWorkOrderFromSketch';
import { createOfferFromEngine } from '@/lib/offers/createOfferFromEngine';
import { savePricingInputs, type EnginePrefill } from '@/lib/pricing/enginePrefill';
import { DEFAULT_LUMP_LINES, type AlesCostSettings, type CostMode, type LumpSumLine } from '@/lib/pricing/alesCostTypes';

const FACTORS: MaterialFactors = { laminate: true, wastePct: 12, miterPct: 8, slopePct: 3 };
function ils(n: number): string { return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL'); }
function m2(n: number): string { return (Math.round(n * 100) / 100).toFixed(2) + ' מ"ר'; }

export interface EngineSketch {
  id: string;
  title: string;
  spec: Record<string, unknown> | null;
}

interface Props {
  sketch: EngineSketch | null;
  materialSettings: MaterialSettings;
  costSettings: AlesCostSettings;
}

export default function PricingEngine({ sketch, materialSettings, costSettings }: Props) {
  const [mode, setMode] = useState<CostMode>('dayRate');
  const [days, setDays] = useState('1.5');
  const [premium, setPremium] = useState('');
  const [lines, setLines] = useState<LumpSumLine[]>(DEFAULT_LUMP_LINES.map((l) => ({ ...l })));
  const [commMode, setCommMode] = useState<CommissionMode>('pct');
  const [commValue, setCommValue] = useState(String(costSettings.commissionPct));
  const [saving, setSaving] = useState('');
  const [offerMsg, setOfferMsg] = useState<{ num: string; id: string } | null>(null);
  const [woMsg, setWoMsg] = useState<{ num: string; id: string } | null>(null);
  const [prefillNote, setPrefillNote] = useState('');
  const [inputSaveMsg, setInputSaveMsg] = useState('');

  const cut = useMemo(() => {
    if (!sketch) return null;
    const dims = sketchSpecToDims(sketch.spec);
    if (!dims.lenCm) return null;
    return calcMaterial(dims, FACTORS, materialSettings);
  }, [sketch, materialSettings]);

  // PREFILL: restore the last-typed inputs saved on this sketch (pricing_inputs in its spec).
  useEffect(() => {
    setPrefillNote('');
    const p = sketch?.spec && (sketch.spec as Record<string, unknown>).pricing_inputs as Partial<EnginePrefill> | undefined;
    if (!p || !p.costMode) return;
    setMode(p.costMode === 'lumpSum' ? 'lumpSum' : 'dayRate');
    if (Array.isArray(p.lumpSumLines) && p.lumpSumLines.length > 0) setLines(p.lumpSumLines.map((l) => ({ ...l })));
    if (p.days) setDays(String(p.days));
    if (p.commissionMode) { setCommMode(p.commissionMode === 'fixed' ? 'fixed' : 'pct'); setCommValue(String(p.commissionValue ?? '')); }
    if (p.artPremiumIls) setPremium(String(p.artPremiumIls));
    setPrefillNote('נטען מהשמירה האחרונה' + (p.savedAtIso ? ' · ' + new Date(String(p.savedAtIso)).toLocaleString('he-IL') : ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketch?.id]);

  const pricing = useMemo(() => {
    return calcPricing({
      costMode: mode,
      materialIls: cut ? cut.totalIls : 0,
      days: Number(days) || 0,
      lumpSumLines: lines,
      artPremiumIls: Number(premium) || 0,
      settings: costSettings,
      commission: { mode: commMode, value: Number(commValue) || 0 },
    });
  }, [mode, cut, days, lines, premium, costSettings, commMode, commValue]);

  function setLine(i: number, field: 'label' | 'amountIls', v: string) {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: field === 'amountIls' ? (Number(v) || 0) : v } : l));
  }
  function addLine() { setLines((prev) => [...prev, { label: '', amountIls: 0 }]); }
  function removeLine(i: number) { setLines((prev) => prev.filter((_, idx) => idx !== i)); }

  function currentPrefill(): EnginePrefill {
    return {
      costMode: mode,
      lumpSumLines: lines,
      days: Number(days) || 0,
      commissionMode: commMode,
      commissionValue: Number(commValue) || 0,
      artPremiumIls: Number(premium) || 0,
      savedAtIso: '',
    };
  }

  async function saveInputsOnly() {
    if (!sketch) return;
    setInputSaveMsg('');
    const res = await savePricingInputs(sketch.id, currentPrefill());
    setInputSaveMsg(res.ok ? '✓ הקלט נשמר לשרטוט' : 'שמירת קלט נכשלה');
  }

  async function saveWorkOrder() {
    if (!sketch || !cut) return;
    setSaving('wo');
    setWoMsg(null);
    savePricingInputs(sketch.id, currentPrefill());
    const res = await createWorkOrderFromSketch({
      sketchId: sketch.id,
      days: mode === 'dayRate' ? (Number(days) || 0) : 0,
      cutList: cut,
      pricing,
    });
    setSaving('');
    if (!res.ok || !res.poId) { window.alert('יצירת הוראת עבודה נכשלה: ' + (res.error || '')); return; }
    setWoMsg({ num: res.poNumber || '', id: res.poId });
  }

  async function saveCustomerOffer() {
    if (!sketch || !cut) return;
    setSaving('offer');
    setOfferMsg(null);
    savePricingInputs(sketch.id, currentPrefill());
    const res = await createOfferFromEngine({ sketchId: sketch.id, pricing });
    setSaving('');
    if (!res.ok || !res.quoteId) { window.alert('שמירת הצעת מחיר נכשלה: ' + (res.error || '')); return; }
    setOfferMsg({ num: res.quoteNumber || '', id: res.quoteId });
  }

  const box = 'w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md text-left';
  const card = 'bg-white border border-stone-200 rounded-lg p-4';
  const row = (label: string, val: string, strong = false) => (
    <div className={'flex justify-between py-1 ' + (strong ? 'font-semibold text-stone-900 border-t border-stone-200 mt-1 pt-2' : 'text-stone-600 text-sm')}>
      <span>{label}</span><span>{val}</span>
    </div>
  );

  if (!sketch) {
    return <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800" dir="rtl">בחר שרטוט כדי לחשב הצעת מחיר.</div>;
  }

  const modeBtn = (m: CostMode, label: string) => (
    <button onClick={() => setMode(m)} className={'text-sm px-4 py-1.5 rounded-md font-medium ' + (mode === m ? 'bg-blue-600 text-white' : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50')}>{label}</button>
  );
  const commBtn = (m: CommissionMode, label: string) => (
    <button onClick={() => { setCommMode(m); setCommValue(m === 'pct' ? String(costSettings.commissionPct) : ''); }}
      className={'text-xs px-2.5 py-1 rounded-md font-medium ' + (commMode === m ? 'bg-stone-800 text-white' : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50')}>{label}</button>
  );

  return (
    <div dir="rtl" className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-stone-500">מתמחר: <span className="font-medium text-stone-800">{sketch.title}</span>{prefillNote && (<span className="mr-2 text-xs text-emerald-600">📂 {prefillNote}</span>)}</div>
        <div className="flex gap-2">
          {modeBtn('dayRate', '📅 מחיר יומי')}
          {modeBtn('lumpSum', '📦 מחיר גלובלי מאלס')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={card}>
          <div className="text-sm font-medium text-blue-700 mb-2">1 · חומר (מהשרטוט{mode === 'lumpSum' ? ' · לייחוס בלבד' : ''})</div>
          {cut ? (
            <>
              {row('מ"ר נדרש', m2(cut.neededM2))}
              {row('לוחות לרכישה', cut.sheets + ' (' + m2(cut.purchasedM2) + ')')}
              {row('עודף/שאריות', m2(cut.leftoverM2))}
              {row('עלות חומר' + (mode === 'lumpSum' ? ' (חישוב שלנו — להשוואה)' : ''), ils(cut.totalIls), true)}
            </>
          ) : (<div className="text-xs text-amber-700">אין מידות תקינות בשרטוט.</div>)}
        </div>

        {mode === 'dayRate' ? (
          <div className={card}>
            <div className="text-sm font-medium text-amber-700 mb-2">2 · עבודה + זמן</div>
            <label className="text-xs text-stone-600 flex items-center gap-2 mb-2">ימי עבודה
              <input type="number" step="0.5" value={days} onChange={(e) => setDays(e.target.value)} className={box + ' w-20'} dir="ltr" />
            </label>
            {row('שכר עבודה', ils(pricing.laborIls))}
            {row('תקורה', ils(pricing.overheadIls))}
            {row('מתכלים', ils(pricing.consumablesIls))}
            {row('עלות עבודה', ils(pricing.laborIls + pricing.overheadIls + pricing.consumablesIls), true)}
          </div>
        ) : (
          <div className={card}>
            <div className="text-sm font-medium text-amber-700 mb-2">2 · הצעת אלס — גלובלי מפורט</div>
            <div className="space-y-1.5">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input value={l.label} onChange={(e) => setLine(i, 'label', e.target.value)} placeholder="תיאור" className="flex-1 px-2 py-1 text-xs border border-stone-300 rounded-md" dir="rtl" />
                  <input type="number" value={l.amountIls || ''} onChange={(e) => setLine(i, 'amountIls', e.target.value)} placeholder="0" className="w-24 px-2 py-1 text-xs border border-stone-300 rounded-md text-left" dir="ltr" />
                  <button onClick={() => removeLine(i)} title="הסר" className="text-stone-300 hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
            </div>
            <button onClick={addLine} className="mt-2 text-xs text-blue-600 hover:underline">+ הוסף שורה</button>
            {row('סה"כ מחיר אלס (כולל הרווח שלו)', ils(pricing.trueCostIls), true)}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm font-medium text-blue-800">עלות אמת · true cost</span>
        <span className="text-lg font-semibold text-blue-800">{ils(pricing.trueCostIls)}</span>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-stone-700 mb-2">3 · תמחור</div>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm text-stone-600">עמלת Marble Art:</span>
          {commBtn('pct', '%')}
          {commBtn('fixed', '₪ קבוע')}
          <input type="number" value={commValue} onChange={(e) => setCommValue(e.target.value)}
            className={box + ' w-24'} dir="ltr" placeholder={commMode === 'pct' ? String(costSettings.commissionPct) : '0'} />
          <span className="text-xs text-stone-400">{commMode === 'pct' ? '%' : '₪'}</span>
        </div>
        {row('עמלה (' + pricing.commissionPct + '%)', ils(pricing.commissionIls))}
        {row('הצעת בסיס (XYZ) · שקוף לאלס', ils(pricing.baseOfferIls), true)}
        <label className="text-xs text-stone-600 flex items-center gap-2 mt-3">פרמיית אמנות (ערך מוסף)
          <input type="number" value={premium} onChange={(e) => setPremium(e.target.value)} className={box + ' w-28'} dir="ltr" placeholder="0" />
        </label>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm font-medium text-emerald-800">הצעה סופית ללקוח · UVW</span>
        <span className="text-lg font-semibold text-emerald-800">{ils(pricing.finalOfferIls)}</span>
      </div>

      {pricing.artPremiumIls > 0 && (
        <div className={card}>
          <div className="text-sm font-medium text-stone-700 mb-2">4 · פיצול פרמיה ({pricing.premiumSplitPct}% / {100 - pricing.premiumSplitPct}%)</div>
          {row('חלק Marble Art', ils(pricing.avshiPremiumShareIls))}
          {row('בונוס לאלס', ils(pricing.alesPremiumBonusIls))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-xs text-stone-500">Ales — סה"כ</div>
          <div className="text-lg font-semibold text-stone-800">{ils(pricing.alesTotalIls)}</div>
          <div className="text-[11px] text-stone-400">{mode === 'lumpSum' ? 'גלובלי ' : 'שכר '}{ils(pricing.alesLaborIncomeIls)} + בונוס {ils(pricing.alesPremiumBonusIls)}</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-xs text-stone-500">Marble Art — סה"כ</div>
          <div className="text-lg font-semibold text-stone-800">{ils(pricing.avshiTotalIls)}</div>
          <div className="text-[11px] text-stone-400">עמלה {ils(pricing.commissionIls)} + פרמיה {ils(pricing.avshiPremiumShareIls)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
        <button onClick={saveWorkOrder} disabled={!cut || !!saving} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">{saving === 'wo' ? 'יוצר…' : '🔧 צור הוראת עבודה לאלס'}</button>
        <button onClick={saveCustomerOffer} disabled={!cut || !!saving} className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">{saving === 'offer' ? 'שומר…' : '📄 צור הצעת מחיר ללקוח'}</button>
        <button onClick={saveInputsOnly} disabled={!sketch} className="text-sm px-4 py-2 border border-stone-300 text-stone-600 rounded-md hover:bg-stone-50">💾 שמור קלט</button>
        {inputSaveMsg && (<span className="text-sm text-emerald-600 self-center">{inputSaveMsg}</span>)}
      </div>

      {woMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center justify-between">
          <span>✓ הוראת עבודה נוצרה · {woMsg.num}</span>
          <a href={'/po/' + woMsg.id + '/ales'} target="_blank" className="text-blue-700 underline">פתח מסמך אלס →</a>
        </div>
      )}
      {offerMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex items-center justify-between">
          <span>✓ הצעת מחיר נשמרה · {offerMsg.num}</span>
          <a href={'/quotes/' + offerMsg.id} className="text-emerald-700 underline">צפה בהצעה →</a>
        </div>
      )}
    </div>
  );
}
