// src/app/sketch/page.tsx
// Sketch builder — technical shop drawing generator for Ales.

import Link from 'next/link';
import SketchBuilder from '@/components/sketch/SketchBuilder';

export const dynamic = 'force-dynamic';

export default function SketchPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📐</div>
          <div>
            <div className="text-lg font-medium text-stone-900">שרטוט ייצור</div>
            <div className="text-xs text-stone-500">מבט על + חתך צד · להעברה לאלס</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>
      <SketchBuilder />
    </div>
  );
}
