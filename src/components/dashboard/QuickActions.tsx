/**
 * src/components/dashboard/QuickActions.tsx
 *
 * 3 large click cards routing to the analyzer pages.
 * Pure routing — no props, no state, no Supabase.
 *
 * Phase 17 — /dashboard build, Path Y (Session 21, 08/05/2026)
 */

import Link from 'next/link';

export default function QuickActions() {
  const cardClass = 'flex flex-col items-center justify-center gap-2 px-4 py-5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors no-underline text-gray-900';

  return (
    <div className="mb-6" dir="rtl">
      <div className="text-sm font-medium text-gray-600 mb-2">פעולות מהירות</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/sinc" className={cardClass}>
          <span className="text-3xl">🎙️</span>
          <span className="text-sm font-medium">שיחה חדשה</span>
        </Link>

        <Link href="/intake?mode=photo" className={cardClass}>
          <span className="text-3xl">📸</span>
          <span className="text-sm font-medium">ניתוח תמונה</span>
        </Link>

        <Link href="/intake?mode=video" className={cardClass}>
          <span className="text-3xl">🎥</span>
          <span className="text-sm font-medium">ניתוח וידאו</span>
        </Link>
      </div>
    </div>
  );
}
