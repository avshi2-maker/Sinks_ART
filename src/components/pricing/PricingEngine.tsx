'use client';

// src/components/pricing/PricingEngine.tsx
// THE ENGINE core — from a sketch to a full price picture, live.
// Pulls material (calc) + Ales cost settings, takes days + art premium, shows:
//   true cost -> base offer (XYZ, +commission) -> final offer (UVW, +premium) -> 50/50 split.
// Receives sketch + settings as props (the page/loader fetches them). Pure display + local state.

import { useState, useMemo } from 'react';
import { calcMaterial, type MaterialSettings, type MaterialFactors } from '@/lib/offers/materialCalc';
import { sketchSpecToDims } from '@/lib/po/sketchSpecToDims';
import { calcPricing } from '@/lib/pricing/alesCostCalc';
import type { AlesCostSettings } from '@/lib/pricing/alesCostTypes';

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
  const [days, setDays] = useState('1.5');
  const [premium, setPremium] = useState('');

  const cut = useMemo(() => {
    if (!sketch) return null;
    const dims = sketchSpecToDims(sketch.spec);
    if (!dims.lenCm) return null;
    return calcMaterial(dims, FACTORS, materialSettings);
  }, [sketch, materialSettings]);

  const pricing = useMemo(() => {
    return calcPricing({
      materialIls: cut ? cut.totalIls : 0,
      days: Number(days) || 0,
      artPremiumIls: Number(premium) || 0,
      settings: costSettings,
    });
  }, [cut, days, premium, costSettings]);

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

  return (
    <div dir="rtl" className="space-y-3">
      <div className="text-sm text-stone-500">מתמחר: <span className="font-medium text-stone-800">{sketch.title}</span></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={card}>
          <div className="text-sm font-medium text-blue-700 mb-2">1 · חומר (מהשרטוט)</div>
          {cut ? (
            <>
              {row('מ"ר נדרש', m2(cut.neededM2))}
              {row('לוחות לרכישה', cut.sheets + ' (' + m2(cut.purchasedM2) + ')')}
              {row('עודף/שאריות', m2(cut.leftoverM2))}
              {row('עלות חומר', ils(cut.totalIls), true)}
            </>
          ) : (<div className="text-xs text-amber-700">אין מידות תקינות בשרטוט.</div>)}
        </div>

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
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm font-medium text-blue-800">עלות אמת · true cost</span>
        <span className="text-lg font-semibold text-blue-800">{ils(pricing.trueCostIls)}</span>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-stone-700 mb-2">3 · תמחור</div>
        {row('עמלת Marble Art (' + pricing.commissionPct + '%)', ils(pricing.commissionIls))}
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
          <div className="text-[11px] text-stone-400">שכר {ils(pricing.alesLaborIncomeIls)} + בונוס {ils(pricing.alesPremiumBonusIls)}</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-xs text-stone-500">Marble Art — סה"כ</div>
          <div className="text-lg font-semibold text-stone-800">{ils(pricing.avshiTotalIls)}</div>
          <div className="text-[11px] text-stone-400">עמלה {ils(pricing.commissionIls)} + פרמיה {ils(pricing.avshiPremiumShareIls)}</div>
        </div>
      </div>
    </div>
  );
}
