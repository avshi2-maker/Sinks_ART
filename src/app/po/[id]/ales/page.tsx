// src/app/po/[id]/ales/page.tsx
// Simplified Ales work-order view of a production order. The full PO page stays at /po/[id].

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchPO } from '@/lib/po/poData';
import AlesWorkOrder from '@/components/po/AlesWorkOrder';

export default async function AlesWorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await fetchPO(id);
  if (!po) {
    return <div className="max-w-xl mx-auto px-4 py-10 text-center text-stone-500" dir="rtl">ההזמנה לא נמצאה.</div>;
  }
  return <AlesWorkOrder po={po} />;
}
