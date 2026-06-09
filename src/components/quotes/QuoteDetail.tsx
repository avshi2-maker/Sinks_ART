'use client';

// src/components/quotes/QuoteDetail.tsx
// Phase 32 Gear 4 — toggles between QuoteView (read/send) and QuoteLineEditor (edit).

import { useState } from 'react';
import QuoteView from './QuoteView';
import QuoteLineEditor from './QuoteLineEditor';
import type { QuoteWithLines } from '@/lib/quotes/types';
import type { OptionRow } from '@/lib/options/optionsCatalog';

export default function QuoteDetail({ quote, catalogOptions = [] }: { quote: QuoteWithLines; catalogOptions?: OptionRow[] }) {
  const [editing, setEditing] = useState(false);

  return (
    <div dir="rtl">
      <div className="flex justify-end mb-3">
        <button onClick={() => setEditing(!editing)} className={editing ? 'text-sm px-3 py-1.5 rounded-md bg-stone-200 text-stone-700' : 'text-sm px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700'}>
          {editing ? '✕ סגור עריכה' : '✏️ ערוך הצעה'}
        </button>
      </div>

      {editing ? (
        <QuoteLineEditor
          quoteId={quote.id}
          customerId={quote.customer_id}
          vatRate={typeof quote.vat_rate === 'number' ? quote.vat_rate : 0.18}
          initialLines={quote.lines || []}
          catalogOptions={catalogOptions}
          onDone={() => setEditing(false)}
        />
      ) : (
        <QuoteView quote={quote} />
      )}
    </div>
  );
}
