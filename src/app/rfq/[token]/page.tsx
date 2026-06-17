// src/app/rfq/[token]/page.tsx
// Ales mobile RFQ page — opens via secret link, no login. Shows job + media + add-ons + price form.
import { fetchRfqByToken } from '@/lib/rfq/rfqData';
import { fetchActiveOptions } from '@/lib/options/optionsCatalog';
import AlesRfqForm from '@/components/rfq/AlesRfqForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AlesRfqPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rfq = await fetchRfqByToken(token);

  if (!rfq) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center" dir="rtl">
        <div className="text-2xl mb-2">🔍</div>
        <div className="text-lg font-medium text-stone-800">הבקשה לא נמצאה</div>
        <div className="text-sm text-stone-500 mt-1">ייתכן שהקישור שגוי או שפג תוקפו.</div>
      </div>
    );
  }

  if (rfq.status === 'answered') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center" dir="rtl">
        <div className="text-3xl mb-2">✓</div>
        <div className="text-lg font-medium text-emerald-700">התמחור כבר נשלח</div>
        <div className="text-sm text-stone-500 mt-1">קיבלנו את ההצעה שלך עבור: {rfq.title_he}</div>
      </div>
    );
  }

  const options = await fetchActiveOptions();
  return <AlesRfqForm rfq={rfq} options={options} />;
}
