// src/app/marble/page.tsx
import Link from 'next/link';
import { fetchSwatches } from '@/lib/marble/marbleData';
import MarbleManager from '@/components/marble/MarbleManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MarblePage() {
  const swatches = await fetchSwatches();
  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🪨</div>
          <div>
            <div className="text-lg font-medium text-stone-900">ספריית שיש</div>
            <div className="text-xs text-stone-500">דגימות לבחירה בשרטוט</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>
      <MarbleManager swatches={swatches} />
    </div>
  );
}
