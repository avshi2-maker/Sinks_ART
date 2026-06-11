// src/app/po/[id]/page.tsx
import { fetchPO } from '@/lib/po/poData';
import PoDocument from '@/components/po/PoDocument';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await fetchPO(id);
  if (!po) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-stone-500" dir="rtl">ההזמנה לא נמצאה.</div>;
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PoDocument po={po} />
    </div>
  );
}
