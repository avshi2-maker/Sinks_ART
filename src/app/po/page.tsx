// src/app/po/page.tsx
import Link from 'next/link';
import { fetchPOs } from '@/lib/po/poData';
import PoList from '@/components/po/PoList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PoPage() {
  const pos = await fetchPOs();
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📋</div>
          <div>
            <div className="text-lg font-medium text-stone-900">הזמנות ייצור</div>
            <div className="text-xs text-stone-500">{pos.length} הזמנות · לאלס</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>
      <PoList pos={pos} />
    </div>
  );
}
