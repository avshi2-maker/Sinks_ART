// src/app/quotes/[id]/page.tsx
// Phase 31 — single quote view page.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchQuote } from '@/lib/quotes/fetchQuotes';
import { QUOTE_STATUS_LABELS_HE, QUOTE_STATUS_COLORS, QuoteStatus } from '@/lib/quotes/types';
import QuoteView from '@/components/quotes/QuoteView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString('he-IL'); }

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await fetchQuote(id);
  if (!quote) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div>
          <div className="text-base font-medium text-stone-900" dir="ltr">{quote.quote_number}</div>
          <div className="text-xs text-stone-500">{quote.customer_name_he || '—'} · {fmtDate(quote.created_at)}</div>
        </div>
        <Link href="/quotes" className="text-sm text-blue-600 no-underline hover:underline">← כל ההצעות</Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ' + (QUOTE_STATUS_COLORS[quote.status as QuoteStatus] || 'bg-stone-100 text-stone-700 border-stone-200')}>
          {QUOTE_STATUS_LABELS_HE[quote.status as QuoteStatus] || quote.status}
        </span>
        <span className="text-sm text-stone-700">סה"כ: <strong>{ils(quote.total_grand)}</strong></span>
        {quote.customer_id && (
          <Link href={`/customers/${quote.customer_id}`} className="text-xs text-blue-600 no-underline hover:underline mr-auto">← לתיק הלקוח</Link>
        )}
      </div>

      <QuoteView quote={quote} />
    </div>
  );
}
