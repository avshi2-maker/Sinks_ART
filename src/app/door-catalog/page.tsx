// src/app/door-catalog/page.tsx
// Phase 37 Step 4A — CRM door catalog editor.

import Link from 'next/link';
import { fetchAllDoorStones } from '@/lib/doors/doorCatalogData';
import DoorsManager from '@/components/doors/DoorsManager';
import DoorOfferLine from '@/components/doors/DoorOfferLine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DoorCatalogPage() {
  const stones = await fetchAllDoorStones();
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🚪</div>
          <div>
            <div className="text-lg font-medium text-stone-900">קטלוג דלתות</div>
            <div className="text-xs text-stone-500">דלת בגובה אפס · גוונים, מחירים ורינדורים</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>
      <DoorsManager stones={stones} />
      <div className="mt-6 pt-5 border-t border-stone-200">
        <DoorOfferLine stones={stones} />
      </div>
    </div>
  );
}
