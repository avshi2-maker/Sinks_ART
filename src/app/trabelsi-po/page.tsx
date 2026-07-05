// src/app/trabelsi-po/page.tsx
// Trabelsi purchasing: new-order builder + the orders register (TRB numerator, statuses, remarks).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchSketchesWithMaterial } from '@/lib/purchasing/trabelsiPoData';
import { fetchTrabelsiOrders } from '@/lib/purchasing/trabelsiOrders';
import { fetchMaterialSettings } from '@/lib/offers/materialSettings';
import TrabelsiPoTabs from '@/components/purchasing/TrabelsiPoTabs';

export default async function TrabelsiPoPage() {
  const [sketches, orders, settings] = await Promise.all([
    fetchSketchesWithMaterial(),
    fetchTrabelsiOrders(),
    fetchMaterialSettings(),
  ]);
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-200">
        <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🛒</div>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">הזמנת רכש — טרבלסי</h1>
          <p className="text-xs text-stone-500">הזמנה חדשה מחישובי חומר · פנקס הזמנות עם מספור, סטטוס והערות</p>
        </div>
      </div>
      <TrabelsiPoTabs sketches={sketches} orders={orders} defaultPricePerM2={settings.pricePerM2} defaultVatPct={settings.vatPct} />
    </div>
  );
}
