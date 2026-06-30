// src/app/offer-builder/page.tsx
// The price-offer builder. Pulls Ales price-breaks for the base picker.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchPriceBreaks } from '@/lib/offers/priceBreaksData';
import OfferBuilder from '@/components/offers/OfferBuilder';

export default async function OfferBuilderPage() {
  const breaks = await fetchPriceBreaks();
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-200">
        <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🧮</div>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">בונה הצעת מחיר</h1>
          <p className="text-xs text-stone-500">בסיס אלס + רכיבים + עמלה → מחיר ללקוח. שמירה מזינה את ROI.</p>
        </div>
      </div>
      <OfferBuilder breaks={breaks} />
    </div>
  );
}
