// src/app/quotes/page.tsx
// Phase 31 — quotes list. All quotes, newest first, with status filter.

import Link from 'next/link';
import { fetchQuotes } from '@/lib/quotes/fetchQuotes';
import { QUOTE_STATUS_LABELS_HE, QUOTE_STATUS_COLORS, QuoteStatus } from '@/lib/quotes/types';
import DeleteQuoteButton from '@/components/quotes/DeleteQuoteButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString('he-IL'); }

const FILTERS: { v: string; l: string }[] = [
  { v: 'all', l: 'הכל' },
  { v: 'draft', l: 'טיוטה' },
  { v: 'sent', l: 'נשלח' },
  { v: 'approved', l: 'אושר' },
  { v: 'rejected', l: 'נדחה' },
];

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const filter = sp.status || 'all';
  const all = await fetchQuotes({ limit: 200 });
  const quotes = filter === 'all' ? all : all.filter((q) => q.status === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🧾</div>
          <div>
            <div className="text-base font-medium text-stone-900">הצעות מחיר <span className="text-stone-400 font-normal">({all.length})</span></div>
            <div className="text-xs text-stone-500">כל ההצעות, מהחדשה לישנה</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <Link key={f.v} href={f.v === 'all' ? '/quotes' : '/quotes?status=' + f.v} className={filter === f.v ? 'text-xs px-3 py-1.5 rounded-full bg-stone-800 text-white no-underline' : 'text-xs px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 no-underline hover:bg-stone-200'}>
            {f.l}
          </Link>
        ))}
      </div>

      {quotes.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">אין הצעות בקטגוריה זו.</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-right">
                <th className="py-2 px-3 font-medium">מספר</th>
                <th className="py-2 px-3 font-medium">לקוח</th>
                <th className="py-2 px-3 font-medium">סכום</th>
                <th className="py-2 px-3 font-medium">סטטוס</th>
                <th className="py-2 px-3 font-medium">תאריכים</th>
                <th className="py-2 px-3 font-medium w-8"></th>
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
                  <td className="py-3 px-3 text-stone-600 text-xs"><div>נוצר: {fmtDate(q.created_at)}</div>{q.updated_at && q.updated_at !== q.created_at && (<div className="text-stone-400">עודכן: {fmtDate(q.updated_at)}</div>)}</td>
                  <td className="py-3 px-3 text-center"><DeleteQuoteButton quoteId={q.id} quoteNumber={q.quote_number} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
