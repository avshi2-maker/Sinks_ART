'use client';

// src/components/po/ales/AlesHeroPage.tsx
// PAGE 1 — the BOOM. GREEN BOX ONLY (Avshi's rule: one glance in the sun; all detail lives
// on pages 2-3). Shows Ales's INCOME (incl. VAT) out of the total invoice, then the scroll hint.
// Mode-aware label: lumpSum -> "גלובלי", dayRate -> "שכר עבודה".

import type { AlesWorkOrderSnapshot } from '@/lib/po/createWorkOrderFromSketch';
import { ils } from '@/lib/po/alesSnapshot';

interface Props { po_number: string; dateStr: string; snap: AlesWorkOrderSnapshot; }

export default function AlesHeroPage({ po_number, dateStr, snap }: Props) {
  const p = snap.pricing;
  const hasPremium = p.artPremiumIls > 0;
  const baseLabel = p.costMode === 'lumpSum' ? 'גלובלי' : 'שכר עבודה';

  return (
    <section className="ales-page bg-white" dir="rtl">
      <div className="max-w-xl mx-auto px-5 py-10 text-center">
        <div className="text-sm text-stone-400 mb-1">{po_number} · {dateStr}</div>
        <div className="text-2xl font-bold text-stone-900 mb-1">🎉 עבודה חדשה נסגרה!</div>
        <div className="text-base text-stone-500 mb-8">{snap.label}</div>

        {/* THE green box — the only content on this page */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-10 mb-8">
          <div className="text-base text-emerald-700 mb-2">הכנסה שלך, אלס</div>
          <div className="text-6xl font-extrabold text-emerald-700 leading-none" dir="ltr">{ils(p.alesTotalIls)}</div>
          <div className="text-sm text-emerald-600 mt-2">כולל מע"מ</div>
          <div className="text-sm text-emerald-700 mt-4">
            {baseLabel} {ils(p.alesLaborIncomeIls)}{hasPremium ? ' + בונוס ' + ils(p.alesPremiumBonusIls) : ''}
          </div>
          <div className="text-sm text-emerald-800 mt-3 font-medium">
            מתוך סך החשבונית: {ils(p.finalOfferIls)}
          </div>
        </div>

        <div className="text-sm text-stone-400 border-t border-stone-100 pt-4">
          👇 גלול לעמוד 2-3 לשרטוט הייצור ולניתוח העלויות המלא
          <div className="text-xs mt-1">(כשיש רגע רגוע — אפשר להדפיס את השרטוט)</div>
        </div>
      </div>
    </section>
  );
}
