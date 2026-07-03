// src/app/po/[id]/ales/page.tsx
// The 3-page Ales work-order document (hero / sketch / cost), read from the frozen snapshot.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchPO } from '@/lib/po/poData';
import AlesDocument from '@/components/po/ales/AlesDocument';

export default async function AlesWorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await fetchPO(id);
  if (!po) {
    return <div className="max-w-xl mx-auto px-4 py-10 text-center text-stone-500" dir="rtl">ההזמנה לא נמצאה.</div>;
  }
  return <AlesDocument po={po} />;
}
