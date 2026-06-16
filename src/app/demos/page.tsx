// src/app/demos/page.tsx
// Demo-Trials gallery: upload AI demos + browse demos & saved sketches with filter tabs.

import Link from 'next/link';
import { fetchDemos } from '@/lib/demos/demosData';
import DemoUploader from '@/components/demos/DemoUploader';
import GalleryGrid from '@/components/demos/GalleryGrid';

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
            <div className="text-lg font-medium text-stone-900">גלריה</div>
            <div className="text-xs text-stone-500">{demos.length} פריטים · הדמיות ושרטוטים</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <div className="mb-4"><DemoUploader /></div>

      <GalleryGrid demos={demos} />
    </div>
  );
}
