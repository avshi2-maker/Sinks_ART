// src/app/price-breaks/page.tsx
// Ales price-break table manager — the base-price source for the offer builder.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchPriceBreaks } from '@/lib/offers/priceBreaksData';
import PriceBreaksManager from '@/components/offers/PriceBreaksManager';

export default async function PriceBreaksPage() {
  const rows = await fetchPriceBreaks();
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-200">
        <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🏷️</div>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">מחירון עבודה — אלס</h1>
          <p className="text-xs text-stone-500">מחירי טרנקי לפי תצורה. הבסיס לבונה הצעת המחיר.</p>
        </div>
      </div>
      <PriceBreaksManager rows={rows} />
    </div>
  );
}
