// src/app/roi/page.tsx
// Phase 40 — ROI dashboard. READ-ONLY business metrics.

import Link from 'next/link';
import { fetchRoiMetrics } from '@/lib/roi/roiData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ils(n: number): string { return '₪' + Math.round(n).toLocaleString('he-IL'); }

export default async function RoiPage() {
  const m = await fetchRoiMetrics();
  const maxPipe = Math.max(1, ...m.pipeline.map((p) => p.count));

  const cards: { label: string; value: string; sub?: string; tone: string }[] = [
    { label: 'הכנסה בהצעות', value: ils(m.revenueQuoted), sub: m.quotesTotal + ' הצעות', tone: 'text-emerald-700' },
    { label: 'רווח כולל', value: ils(m.totalMargin), sub: m.avgMarginPct + '% רווחיות ממוצעת', tone: 'text-blue-700' },
    { label: 'עלות כוללת', value: ils(m.totalCost), sub: 'מחיר עלות (אלס)', tone: 'text-stone-700' },
    { label: 'המרת לידים', value: m.leadsConverted + '/' + (m.leadsTotal + m.leadsConverted), sub: m.leadConversionPct + '% מהפניות', tone: 'text-purple-700' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📊</div>
          <div>
            <div className="text-lg font-medium text-stone-900">לוח ROI</div>
            <div className="text-xs text-stone-500">תמונת מצב עסקית · נכון ל-{new Date().toLocaleString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-stone-200 rounded-lg p-4">
            <div className="text-xs text-stone-500">{c.label}</div>
            <div className={'text-2xl font-bold ' + c.tone}>{c.value}</div>
            {c.sub && (<div className="text-xs text-stone-400 mt-1">{c.sub}</div>)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-stone-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-stone-700 mb-3">צנרת פרויקטים ({m.projects})</h2>
          <div className="space-y-2">
            {m.pipeline.map((p) => (
              <div key={p.status}>
                <div className="flex justify-between text-xs text-stone-600 mb-0.5">
                  <span>{p.status}</span><span>{p.count}</span>
                </div>
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: (p.count / maxPipe * 100) + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-stone-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-stone-700 mb-3">פעילות</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">לקוחות פעילים</dt><dd className="font-medium text-stone-800">{m.customers}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">פרויקטים</dt><dd className="font-medium text-stone-800">{m.projects}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">פניות מהאתר</dt><dd className="font-medium text-stone-800">{m.leadsTotal}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">הצעות מחיר</dt><dd className="font-medium text-stone-800">{m.quotesTotal} ({m.quotesSent} נשלחו)</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
