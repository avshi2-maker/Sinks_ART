'use client';

// src/components/po/ales/AlesHeroPage.tsx
// PAGE 1 — the BOOM. One glance, in the sun: Ales's total is the giant number.
// Full transparency below (his labor income + bonus, Avshi's commission open).
// Ends with a gentle "scroll to pages 2-3" instruction. Print: own A4 page.

import type { AlesWorkOrderSnapshot } from '@/lib/po/createWorkOrderFromSketch';
import { ils } from '@/lib/po/alesSnapshot';

interface Props { po_number: string; dateStr: string; snap: AlesWorkOrderSnapshot; }

export default function AlesHeroPage({ po_number, dateStr, snap }: Props) {
  const p = snap.pricing;
  const hasPremium = p.artPremiumIls > 0;

  return (
    <section className="ales-page bg-white" dir="rtl">
      <div className="max-w-xl mx-auto px-5 py-8 text-center">
        <div className="text-sm text-stone-400 mb-1">{po_number} · {dateStr}</div>
        <div className="text-2xl font-bold text-stone-900 mb-1">🎉 עבודה חדשה נסגרה!</div>
        <div className="text-base text-stone-500 mb-6">{snap.label}</div>

        {/* THE number */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-8 mb-6">
          <div className="text-sm text-emerald-700 mb-1">הרווח שלך, אלס</div>
          <div className="text-6xl font-extrabold text-emerald-700 leading-none" dir="ltr">{ils(p.alesTotalIls)}</div>
          <div className="text-sm text-emerald-600 mt-3">
            שכר עבודה {ils(p.alesLaborIncomeIls)}{hasPremium ? ' + בונוס ' + ils(p.alesPremiumBonusIls) : ''}
          </div>
        </div>

        {/* transparent split of the whole job */}
        <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 mb-6">
          <div className="flex justify-between py-1"><span>סכום ההזמנה</span><span className="font-medium text-stone-800">{ils(p.finalOfferIls)}</span></div>
          <div className="flex justify-between py-1"><span>עלות חומר (טרבלסי)</span><span>{ils(p.materialIls)}</span></div>
          <div className="flex justify-between py-1"><span>עמלת Marble Art ({p.commissionPct}%)</span><span>{ils(p.commissionIls)}</span></div>
          {hasPremium && (<div className="flex justify-between py-1"><span>פרמיית אמנות · חלוקה {p.premiumSplitPct}/{100 - p.premiumSplitPct}</span><span>{ils(p.artPremiumIls)}</span></div>)}
          <div className="flex justify-between py-2 border-t border-stone-200 mt-1 font-semibold text-emerald-700"><span>הרווח שלך</span><span>{ils(p.alesTotalIls)}</span></div>
        </div>

        <div className="text-sm text-stone-400 border-t border-stone-100 pt-4">
          👇 גלול לעמוד 2-3 לשרטוט הייצור ולניתוח העלויות המלא
          <div className="text-xs mt-1">(כשיש רגע רגוע — אפשר להדפיס את השרטוט)</div>
        </div>
      </div>
    </section>
  );
}
