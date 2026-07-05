// src/app/quotes/page.tsx
// Quotes list. All quotes, newest first, with status filter.
// Archived quotes are hidden from the default view — visible only under the בארכיון tab.
// Every row: full date+time stamp + actions (✏️ edit · 📦/♻️ archive · 🖨️ print · 💬 WhatsApp · 🗑️ delete).

import Link from 'next/link';
import { fetchQuotes } from '@/lib/quotes/fetchQuotes';
import { QUOTE_STATUS_LABELS_HE, QUOTE_STATUS_COLORS, QuoteStatus } from '@/lib/quotes/types';
import DeleteQuoteButton from '@/components/quotes/DeleteQuoteButton';
import QuoteRowActions from '@/components/quotes/QuoteRowActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }
function fmtStamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

const FILTERS: { v: string; l: string }[] = [
  { v: 'all', l: 'הכל' },
  { v: 'draft', l: 'טיוטה' },
  { v: 'sent', l: 'נשלח' },
  { v: 'approved', l: 'אושר' },
  { v: 'rejected', l: 'נדחה' },
  { v: 'archived', l: '📦 בארכיון' },
];

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const filter = sp.status || 'all';
  const all = await fetchQuotes({ limit: 200 });
  // default view hides archived; the archive tab shows only archived
  const quotes = filter === 'all'
    ? all.filter((q) => q.status !== 'archived')
    : all.filter((q) => q.status === filter);
  const activeCount = all.filter((q) => q.status !== 'archived').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🧾</div>
          <div>
            <div className="text-base font-medium text-stone-900">הצעות מחיר <span className="text-stone-400 font-normal">({activeCount})</span></div>
            <div className="text-xs text-stone-500">כל ההצעות, מהחדשה לישנה · בארכיון מוסתר כברירת מחדל</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <Link key={f.v} href={f.v === 'all' ? '/quotes' : '/quotes?status=' + f.v}
            className={'text-sm px-3 py-1 rounded-full no-underline border ' + (filter === f.v ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50')}>
            {f.l}
          </Link>
        ))}
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-8 text-center text-sm text-stone-400">
          אין הצעות מחיר בתצוגה זו.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-stone-500 border-b border-stone-200">
                <th className="py-2 px-3 font-medium">מס׳ הצעה</th>
                <th className="py-2 px-3 font-medium">לקוח</th>
                <th className="py-2 px-3 font-medium">סה"כ</th>
                <th className="py-2 px-3 font-medium">סטטוס</th>
                <th className="py-2 px-3 font-medium">תאריך</th>
                <th className="py-2 px-3 font-medium text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-stone-100 hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-3">
                    <Link href={`/quotes/${q.id}`} className="font-medium text-blue-700 no-underline hover:underline" dir="ltr">{q.quote_number}</Link>
                  </td>
                  <td className="py-3 px-3 text-stone-700">{q.customer_name_he || '—'}</td>
                  <td className="py-3 px-3 text-stone-900 font-medium">{ils(q.total_grand)}</td>
                  <td className="py-3 px-3">
                    <span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ' + (QUOTE_STATUS_COLORS[q.status as QuoteStatus] || 'bg-stone-100 text-stone-700 border-stone-200')}>
                      {QUOTE_STATUS_LABELS_HE[q.status as QuoteStatus] || q.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-600 text-xs"><div>נוצר: {fmtStamp(q.created_at)}</div>{q.updated_at && q.updated_at !== q.created_at && (<div className="text-stone-400">עודכן: {fmtStamp(q.updated_at)}</div>)}</td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <QuoteRowActions quoteId={q.id} quoteNumber={q.quote_number} customerName={q.customer_name_he} totalGrand={q.total_grand} isArchived={q.status === 'archived'} />
                    <span className="inline-block mx-1 text-stone-200">|</span>
                    <DeleteQuoteButton quoteId={q.id} quoteNumber={q.quote_number} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
