'use client';

// src/components/offers/MaterialCalculator.tsx
// Standalone material calculator: sink dimensions -> 8-panel deployment -> ×lamination
// -> +waste/miter/slope -> m² needed -> sheets -> leftover -> Trabelsi cost. Copy for offer.

import { useState, useMemo } from 'react';
import { calcMaterial, type SinkDims, type MaterialFactors, type MaterialSettings } from '@/lib/offers/materialCalc';

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }
function m2(n: number): string { return (Math.round(n * 100) / 100).toFixed(2) + ' מ"ר'; }

const GOLDMAN: SinkDims = { lenCm: 295, widCm: 45, heightCm: 25, basinDepthCm: 15, endWallCm: 20, rimCm: 3.5 };

export default function MaterialCalculator({ settings }: { settings: MaterialSettings }) {
  const [d, setD] = useState<SinkDims>(GOLDMAN);
  const [f, setF] = useState<MaterialFactors>({ laminate: true, wastePct: 12, miterPct: 8, slopePct: 3 });
  const [copied, setCopied] = useState(false);

  const r = useMemo(() => calcMaterial(d, f, settings), [d, f, settings]);

  function setDim(k: keyof SinkDims, v: string) { setD((p) => ({ ...p, [k]: Number(v) || 0 })); }

  const summaryText = useMemo(() => {
    const L: string[] = [];
    L.push('חישוב חומר — כיור ' + (d.lenCm / 100).toFixed(2) + 'מ');
    L.push('שטח פרוס: ' + m2(r.deployedM2) + (f.laminate ? ' → ×2 למינציה: ' + m2(r.laminatedM2) : ''));
    L.push('מ"ר נדרש (כולל בזבוז/תפר/שיפוע): ' + m2(r.neededM2));
    L.push('לוחות לרכישה: ' + r.sheets + ' (' + m2(r.purchasedM2) + ')');
    L.push('עודף/שאריות: ' + m2(r.leftoverM2));
    L.push('');
    L.push('חומר: ' + ils(r.materialIls) + ' · כלוב: ' + ils(r.crateIls) + ' · הובלה: ' + ils(r.deliveryIls));
    L.push('סה"כ עלות חומר (כולל מע"מ): ' + ils(r.totalIls));
    return L.join('\n');
  }, [d, f, r]);

  function doCopy() {
    navigator.clipboard.writeText(summaryText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const inp = 'px-2 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white w-full text-left';
  const card = 'bg-white border border-stone-200 rounded-lg p-4 mb-3';
  const dimField = (label: string, k: keyof SinkDims) => (
    <label className="text-xs text-stone-600">{label}<input type="number" value={d[k]} onChange={(e) => setDim(k, e.target.value)} className={inp + ' mt-1'} dir="ltr" /></label>
  );

  return (
    <div dir="rtl">
      {/* dimensions */}
      <div className={card}>
        <div className="text-sm text-blue-700 mb-2">1 · מידות הכיור (ס"מ)</div>
        <div className="grid grid-cols-3 gap-2">
          {dimField('אורך כולל', 'lenCm')}
          {dimField('רוחב (עומק)', 'widCm')}
          {dimField('גובה', 'heightCm')}
          {dimField('עומק אגן', 'basinDepthCm')}
          {dimField('דופן קצה (×2)', 'endWallCm')}
          {dimField('שפת מסגרת', 'rimCm')}
        </div>
        <button onClick={() => setD(GOLDMAN)} className="text-xs text-stone-400 hover:text-blue-600 mt-2">↺ נחום גולדמן 2.70</button>
      </div>

      {/* panels breakdown */}
      <div className={card}>
        <div className="text-sm text-stone-600 mb-2">2 · פריסה שטוחה — {r.panels.length} לוחות</div>
        {r.panels.map((p, i) => (
          <div key={i} className="flex justify-between text-xs text-stone-500 py-0.5">
            <span>{p.label} <span className="text-stone-400">({p.calc})</span></span><span>{m2(p.m2)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm border-t border-stone-200 mt-2 pt-2"><span>שטח פרוס (שכבה אחת)</span><strong>{m2(r.deployedM2)}</strong></div>
      </div>

      {/* factors */}
      <div className={card}>
        <div className="text-sm text-amber-700 mb-3">3 · גורמים</div>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={f.laminate} onChange={(e) => setF((p) => ({ ...p, laminate: e.target.checked }))} />
          למינציה כפולה ×2 <span className="text-xs text-stone-400">(אלס בונה הכל כפול — 12מ"מ)</span>
        </label>
        {([['בזבוז ניסור', 'wastePct', 30], ['חיתוך 45° (תפרים)', 'miterPct', 20], ['תוספת שיפוע', 'slopePct', 10]] as const).map(([label, key, max]) => (
          <div key={key} className="flex items-center gap-3 mb-2">
            <label className="text-sm min-w-[130px]">{label}</label>
            <input type="range" min={0} max={max} step={1} value={f[key]} onChange={(e) => setF((p) => ({ ...p, [key]: Number(e.target.value) }))} className="flex-1" />
            <span className="text-sm font-medium min-w-[38px]">{f[key]}%</span>
          </div>
        ))}
      </div>

      {/* result */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-3">
        <div className="flex justify-between text-sm text-stone-600 py-0.5"><span>פרוס × {f.laminate ? 2 : 1} למינציה</span><span>{m2(r.laminatedM2)}</span></div>
        <div className="flex justify-between text-sm text-stone-600 py-0.5"><span>+ בזבוז {f.wastePct}% · תפר {f.miterPct}% · שיפוע {f.slopePct}%</span><span>+{m2(r.neededM2 - r.laminatedM2)}</span></div>
        <div className="flex justify-between text-base font-semibold text-stone-900 py-1 border-t border-stone-200 mt-1"><span>מ"ר נדרש</span><span>{m2(r.neededM2)}</span></div>
        <div className="flex justify-between text-lg font-semibold text-blue-700 py-0.5"><span>לוחות לרכישה</span><span>{r.sheets} ({m2(r.purchasedM2)})</span></div>
        <div className="flex justify-between text-sm text-amber-700 py-0.5"><span>עודף / שאריות</span><span>{m2(r.leftoverM2)}</span></div>
      </div>

      {/* cost */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 mb-3">
        <div className="flex justify-between text-sm text-stone-600 py-0.5"><span>חומר ({m2(r.purchasedM2)} × {ils(settings.pricePerM2)})</span><span>{ils(r.materialIls)}</span></div>
        <div className="flex justify-between text-sm text-stone-600 py-0.5"><span>כלוב + הובלה</span><span>{ils(r.crateIls + r.deliveryIls)}</span></div>
        <div className="flex justify-between text-sm text-stone-500 py-0.5"><span>מע"מ {settings.vatPct}%</span><span>{ils(r.vatIls)}</span></div>
        <div className="flex justify-between text-lg font-semibold text-stone-900 py-1 border-t border-stone-200 mt-1"><span>סה"כ עלות חומר</span><span>{ils(r.totalIls)}</span></div>
      </div>

      <button onClick={doCopy} className="text-sm px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50">{copied ? 'הועתק ✓' : '📋 העתק לחישוב הצעה'}</button>

      <div className="mt-3">
        <div className="text-xs text-stone-400 mb-1">תצוגה מקדימה (מועתק):</div>
        <pre className="bg-white border border-stone-200 rounded-lg p-3 text-sm text-stone-800 whitespace-pre-wrap font-sans">{summaryText}</pre>
      </div>
    </div>
  );
}
