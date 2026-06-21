// src/app/offers-sent/page.tsx
// Sent-offers register — all saved ARVO offers with status/recipient/view/edit/delete.
import { listArvoOffers } from '@/lib/offers/arvoOffersData';
import OffersSentTracker from '@/components/offers/OffersSentTracker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OffersSentPage() {
  const offers = await listArvoOffers();
  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-stone-800">הצעות שנשלחו</h1>
        <p className="text-sm text-stone-500 mt-1">מעקב אחר הצעות ARVO שנשמרו ונשלחו — סטטוס, נמען, צפייה ועריכה</p>
      </div>
      <OffersSentTracker offers={offers} />
    </div>
  );
}
