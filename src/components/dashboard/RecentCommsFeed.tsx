/**
 * src/components/dashboard/RecentCommsFeed.tsx
 *
 * Last 10 customer_communications across ALL comm_types.
 * Joined with media_analyses so photo/mp4 rows can show their Cloudinary URL
 * (the audio_url column is null on non-audio rows by convention).
 *
 * Each row: type icon, customer name, optional duration (calls only),
 * subject, date+time, link arrow → /customers/[customer_id].
 *
 * Phase 17 — /dashboard build, Path Y (Session 21, 08/05/2026)
 */

import Link from 'next/link';
import type { DashboardComm } from '@/app/dashboard/fetchDashboardData';
import ArchiveButton from '@/components/dashboard/ArchiveButton';

interface Props {
  comms: DashboardComm[];
}

function commTypeEmoji(type: string): string {
  if (type === 'call')  return '🎙️';
  if (type === 'photo') return '📸';
  if (type === 'mp4')   return '🎥';
  return                       '📋';
}

// Israeli short date+time: "8.5.2026 14:45"
function formatIsraeliDateTime(iso: string): string {
  const d = new Date(iso);
  const date = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}

// Format duration_seconds: <60 = "40s", >=60 = "M:SS"
function formatDuration(secs: number | null): string | null {
  if (secs === null || secs === undefined || !Number.isFinite(secs)) return null;
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecentCommsFeed({ comms }: Props) {
  if (comms.length === 0) {
    return (
      <div className="mb-6" dir="rtl">
        <div className="text-sm font-medium text-gray-600 mb-2">תקשורת אחרונה</div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
          אין תקשורת מתועדת עדיין — התחל שיחה ראשונה
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">
          תקשורת אחרונה <span className="text-gray-400 font-normal">({comms.length} אחרונות)</span>
        </div>
        <span className="text-xs text-gray-400">כל הסוגים</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {comms.map((c, idx) => {
          const dur = formatDuration(c.duration_seconds);
          return (
            <div
              key={c.comm_id}
              className={
                'grid items-center gap-3 px-3 py-3 hover:bg-gray-50 ' +
                (idx > 0 ? 'border-t border-gray-100 ' : '')
              }
              style={{ gridTemplateColumns: '36px 1fr 130px 52px' }}
            >
              <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center text-base" aria-hidden="true">
                {commTypeEmoji(c.comm_type)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {c.comm_type === 'call' ? 'שיחה' : c.comm_type === 'photo' ? 'תמונה' : c.comm_type === 'mp4' ? 'וידאו' : c.comm_type}
                  {' · '}
                  {c.customer_name}
                  {dur ? <span className="text-gray-400 font-normal"> · {dur}</span> : null}
                </div>
                <div className="text-xs text-gray-500 truncate" title={c.subject}>
                  {c.subject || <span className="italic text-gray-400">ללא כותרת</span>}
                </div>
              </div>
              <div className="text-xs text-gray-500 text-left">{formatIsraeliDateTime(c.created_at)}</div>
              <div className="flex items-center justify-end gap-2.5">
                <ArchiveButton kind="comm" id={c.comm_id} />
                <Link
                  href={`/customers/${c.customer_id}`}
                  className="text-blue-600 hover:underline no-underline text-base"
                  aria-label="פתח לקוח"
                >
                  ←
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
