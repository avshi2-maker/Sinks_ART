// src/app/addons/page.tsx
import Link from 'next/link';
import { fetchAddons } from '@/lib/addons/addonsData';
import AddonsManager from '@/components/addons/AddonsManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AddonsPage() {
  const addons = await fetchAddons();
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🧩</div>
          <div>
            <div className="text-lg font-medium text-stone-900">קטלוג תוספות</div>
            <div className="text-xs text-stone-500">פריטים לבחירה בשינויים</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>
      <AddonsManager addons={addons} />
    </div>
  );
}
