/**
 * src/components/dashboard/TodayActivityStrip.tsx
 *
 * 4-card strip at the top of /dashboard:
 *   - Calls today (count)
 *   - Photos today (count)
 *   - Videos today (count)
 *   - API cost today (USD, purple-tinted to distinguish "money" from "volume")
 *
 * Pure presentation. No state, no fetching. Reads from props.
 *
 * Phase 17 — /dashboard build, Path Y (Session 21, 08/05/2026)
 */

interface Props {
  callCount:    number;
  photoCount:   number;
  videoCount:   number;
  totalCostUsd: number;
}

export default function TodayActivityStrip({ callCount, photoCount, videoCount, totalCostUsd }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4" dir="rtl">
      <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span>🎙️</span>
          <span>שיחות היום</span>
        </div>
        <div className="text-2xl font-medium text-gray-900">{callCount}</div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span>📸</span>
          <span>תמונות היום</span>
        </div>
        <div className="text-2xl font-medium text-gray-900">{photoCount}</div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span>🎥</span>
          <span>וידאו היום</span>
        </div>
        <div className="text-2xl font-medium text-gray-900">{videoCount}</div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-md px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-indigo-700 mb-1">
          <span>💰</span>
          <span>עלות API היום</span>
        </div>
        <div className="text-2xl font-medium text-indigo-900">${totalCostUsd.toFixed(4)}</div>
      </div>
    </div>
  );
}
