/**
 * src/app/dashboard/layout.tsx
 *
 * Shared shell for /dashboard. Hebrew RTL container, header strip with
 * date + refresh hint. Phase 18 will replace the header with a real top
 * navigation bar; for now this is the minimum to make the page feel like
 * its own destination, not just a list of components.
 *
 * Phase 17 — /dashboard build, Path Y (Session 21, 08/05/2026)
 */

import type { ReactNode } from 'react';
import TopNav from '@/components/shared/TopNav';
import LiveClock from '@/components/shared/LiveClock';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Format today's date as Israeli short
  const now = new Date();
  const dateStr = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
  const dayNamesHe = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dayName = dayNamesHe[now.getDay()];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <TopNav />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center text-xl">🏠</div>
            <div>
              <div className="text-base font-medium text-gray-900">לוח בקרה ראשי</div>
              <div className="text-xs text-gray-500">Marble Art Sinks · אבשי ספיר</div>
            </div>
          </div>
          <div className="text-left">
            <div className="mb-0.5"><LiveClock /></div>
            <div className="text-sm font-medium text-gray-900">{dateStr} · יום {dayName}</div>
            <div className="text-xs text-gray-500 mt-0.5">עודכן: עכשיו</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
