// src/app/demos/page.tsx
// Phase 38 — Demo-Trials gallery: upload + browse AI הדמיה demos.

import Link from 'next/link';
import { fetchDemos } from '@/lib/demos/demosData';
import DemoUploader from '@/components/demos/DemoUploader';
import DemoCard from '@/components/demos/DemoCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DemosPage() {
  const demos = await fetchDemos();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🎨</div>
          <div>
            <div className="text-lg font-medium text-stone-900">ספריית הדמיות</div>
            <div className="text-xs text-stone-500">{demos.length} הדמיות · Demo-Trials</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <div className="mb-4"><DemoUploader /></div>

      {demos.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">אין הדמיות עדיין. העלו את הראשונה.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {demos.map((d) => (<DemoCard key={d.id} demo={d} />))}
        </div>
      )}
    </div>
  );
}
