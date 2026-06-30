/**
 * src/components/dashboard/ActiveProjectsList.tsx
 *
 * Phase 3 command-center: each active project shows its customer, the PRIMARY
 * contact (who to follow up — name · title · click-to-call/email), the project
 * status, and the correspondence status (last contact type + how long ago).
 * Clicking a row jumps to /customers/[customer_id] for the full picture.
 */

import Link from 'next/link';
import type { DashboardProject } from '@/app/dashboard/fetchDashboardData';
import ArchiveButton from '@/components/dashboard/ArchiveButton';

interface Props { projects: DashboardProject[]; }

function statusBadgeClasses(status: string): string {
  if (status === 'ליד')               return 'bg-amber-50 text-amber-800';
  if (status === 'שיחת בירור')         return 'bg-blue-50 text-blue-800';
  if (status === 'הצעת מחיר נשלחה')    return 'bg-purple-50 text-purple-800';
  if (status === 'אושר')              return 'bg-teal-50 text-teal-800';
  if (status === 'שולמה מקדמה')        return 'bg-green-50 text-green-800';
  if (status === 'תשלום מלא')          return 'bg-green-100 text-green-900';
  return                                      'bg-gray-50 text-gray-700';
}

const COMM_LABEL: Record<string, string> = {
  call: '🎙️ שיחה', email: '📧 מייל', whatsapp: '💬 וואטסאפ', photo: '📸 תמונה', mp4: '🎥 וידאו',
  note_customer: '💬 לקוח', note_ales: '🔨 אלס', other: '📋 הערה',
};

function commLabel(type: string | null): string {
  if (!type) return '—';
  return COMM_LABEL[type] || '📋 ' + type;
}

// "היום" / "אתמול" / "לפני N ימים" / "לפני N שבועות"
function agoHe(iso: string | null): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  const w = Math.floor(days / 7);
  return w === 1 ? 'לפני שבוע' : `לפני ${w} שבועות`;
}

// Older than 7 days with an active status = needs a nudge.
function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) / 86400000 > 7;
}

export default function ActiveProjectsList({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="mb-6" dir="rtl">
        <div className="text-sm font-medium text-gray-600 mb-2">לוח פרויקטים פעילים</div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center text-sm text-gray-500">אין פרויקטים פעילים כרגע</div>
      </div>
    );
  }

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">לוח פרויקטים פעילים <span className="text-gray-400 font-normal">({projects.length})</span></div>
        <span className="text-xs text-gray-400">לקוח · איש קשר ראשי · סטטוס · תקשורת אחרונה</span>
      </div>

      <div className="space-y-2">
        {projects.map((p) => (
          <div key={p.project_id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              {/* Right: customer + project + contact */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/customers/${p.customer_id}`} className="font-semibold text-gray-900 hover:text-blue-700 no-underline truncate">{p.customer_name}</Link>
                  <span className={'inline-block text-xs px-2 py-0.5 rounded-full ' + statusBadgeClasses(p.project_status)}>{p.project_status}</span>
                </div>
                <div className="text-sm text-gray-600 truncate mt-0.5" title={p.project_title}>{p.project_title}</div>

                {/* Primary contact */}
                <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
                  {p.primary_contact_name ? (
                    <>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800">★ {p.primary_contact_name}{p.primary_contact_title ? ' · ' + p.primary_contact_title : ''}</span>
                      {p.primary_contact_phone && <a href={'tel:' + p.primary_contact_phone} className="text-blue-600 hover:underline no-underline" dir="ltr">📞 {p.primary_contact_phone}</a>}
                      {p.primary_contact_email && <a href={'mailto:' + p.primary_contact_email} className="text-blue-600 hover:underline no-underline" dir="ltr">📧</a>}
                    </>
                  ) : (
                    <span className="text-gray-400">אין איש קשר ראשי</span>
                  )}
                </div>
              </div>

              {/* Left: correspondence status + actions */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-xs text-gray-600 whitespace-nowrap">{commLabel(p.last_comm_type)}</div>
                <div className={'text-xs whitespace-nowrap ' + (isStale(p.last_comm_at) ? 'text-red-600 font-medium' : 'text-gray-400')}>
                  {p.last_comm_at ? agoHe(p.last_comm_at) : 'אין תקשורת'}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <ArchiveButton kind="project" id={p.project_id} />
                  <Link href={`/customers/${p.customer_id}`} className="text-blue-600 hover:underline no-underline" aria-label={`פתח ${p.project_title}`}>←</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
