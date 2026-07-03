'use client';

// src/components/po/ales/AlesCostPage.tsx
// PAGE 3 — the full A-Z analysis: 8-panel cut list + labor + true cost + offer math.
// Full transparency (Avshi's commission + premium split open). Own A4 page.

import type { AlesWorkOrderSnapshot } from '@/lib/po/createWorkOrderFromSketch';
import { ils, m2 } from '@/lib/po/alesSnapshot';

interface Props { snap: AlesWorkOrderSnapshot; }

export default function AlesCostPage({ snap }: Props) {
  const c = snap.cutList;
  const p = snap.pricing;
  const hasPremium = p.artPremiumIls > 0;

  const line = (label: string, val: string, strong = false) => (
    <div className={'flex justify-between py-1 ' + (strong ? 'font-semibold text-stone-900 border-t border-stone-200 mt-1 pt-2' : 'text-stone-600 text-sm')}>
      <span>{label}</span><span dir="ltr">{val}</span>
    </div>
  );
  const card = 'bg-white border border-stone-200 rounded-lg p-4 mb-3';

  return (
    <section className="ales-page bg-white" dir="rtl">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="text-lg font-semibold text-stone-900 mb-4">ניתוח עלויות מלא · {snap.label}</div>

        {/* material cut list */}
        <div className={card}>
          <div className="text-sm font-medium text-blue-700 mb-2">חומר · פריסת {c.panels.length} לוחות</div>
          {c.panels.map((pn, i) => (
            <div key={i} className="flex justify-between text-xs text-stone-500 py-0.5">
              <span>{pn.label} <span className="text-stone-400">({pn.calc})</span></span><span dir="ltr">{m2(pn.m2)}</span>
            </div>
          ))}
          {line('שטח פרוס (שכבה אחת)', m2(c.deployedM2))}
          {line('מ"ר נדרש (כולל למינציה/בזבוז/תפר)', m2(c.neededM2))}
          {line('לוחות לרכישה', c.sheets + ' (' + m2(c.purchasedM2) + ')')}
          {line('עודף / שאריות', m2(c.leftoverM2))}
          {line('עלות חומר (כולל מע"מ)', ils(c.totalIls), true)}
        </div>

        {/* labor + time */}
        <div className={card}>
          <div className="text-sm font-medium text-amber-700 mb-2">עבודה + זמן · {snap.days} ימי עבודה</div>
          {line('שכר עבודה', ils(p.laborIls))}
          {line('תקורה', ils(p.overheadIls))}
          {line('מתכלים', ils(p.consumablesIls))}
          {line('עלות עבודה', ils(p.laborIls + p.overheadIls + p.consumablesIls), true)}
        </div>

        {/* true cost -> offer */}
        <div className={card}>
          <div className="text-sm font-medium text-stone-700 mb-2">עלות אמת → הצעה</div>
          {line('עלות אמת (חומר + עבודה)', ils(p.trueCostIls), true)}
          {line('עמלת Marble Art (' + p.commissionPct + '%)', ils(p.commissionIls))}
          {line('הצעת בסיס (XYZ)', ils(p.baseOfferIls))}
          {hasPremium && line('פרמיית אמנות (ערך מוסף)', ils(p.artPremiumIls))}
          {line('הצעה סופית ללקוח (UVW)', ils(p.finalOfferIls), true)}
        </div>

        {/* the split */}
        {hasPremium && (
          <div className={card}>
            <div className="text-sm font-medium text-stone-700 mb-2">חלוקת פרמיית האמנות ({p.premiumSplitPct}% / {100 - p.premiumSplitPct}%)</div>
            {line('חלק Marble Art', ils(p.avshiPremiumShareIls))}
            {line('בונוס לאלס', ils(p.alesPremiumBonusIls))}
          </div>
        )}

        {/* bottom line — both parties, open */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="text-xs text-emerald-600">אלס — סה"כ</div>
            <div className="text-xl font-bold text-emerald-700" dir="ltr">{ils(p.alesTotalIls)}</div>
            <div className="text-[11px] text-emerald-600">שכר {ils(p.alesLaborIncomeIls)}{hasPremium ? ' + בונוס ' + ils(p.alesPremiumBonusIls) : ''}</div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
            <div className="text-xs text-stone-500">Marble Art — סה"כ</div>
            <div className="text-xl font-bold text-stone-800" dir="ltr">{ils(p.avshiTotalIls)}</div>
            <div className="text-[11px] text-stone-400">עמלה {ils(p.commissionIls)}{hasPremium ? ' + פרמיה ' + ils(p.avshiPremiumShareIls) : ''}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
