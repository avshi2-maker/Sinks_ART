/**
 * src/components/dashboard/ActiveProjectsList.tsx
 *
 * Table of active projects (statuses: ליד / שיחת בירור / הצעת מחיר נשלחה /
 * אושר / שולמה מקדמה / תשלום מלא). Sorted by most recent first (sort
 * happens in fetchDashboardData query, this component just renders).
 *
 * Each row links to /customers/[customer_id] so clicking jumps to the
 * customer detail page (Phase 16) where full project context lives.
 *
 * Phase 17 — /dashboard build, Path Y (Session 21, 08/05/2026)
 */

import Link from 'next/link';
import type { DashboardProject } from '@/app/dashboard/fetchDashboardData';

interface Props {
  projects: DashboardProject[];
}

// Status badge colors matching Mockup v2
function statusBadgeClasses(status: string): string {
  if (status === 'ליד')               return 'bg-amber-50 text-amber-800';
  if (status === 'שיחת בירור')         return 'bg-blue-50 text-blue-800';
  if (status === 'הצעת מחיר נשלחה')    return 'bg-purple-50 text-purple-800';
  if (status === 'אושר')              return 'bg-teal-50 text-teal-800';
  if (status === 'שולמה מקדמה')        return 'bg-green-50 text-green-800';
  if (status === 'תשלום מלא')          return 'bg-green-100 text-green-900';
  return                                      'bg-gray-50 text-gray-700';
}

// Israeli short date format: "8.5.2026"
function formatIsraeliDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export default function ActiveProjectsList({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="mb-6" dir="rtl">
        <div className="text-sm font-medium text-gray-600 mb-2">פרויקטים פעילים</div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
          אין פרויקטים פעילים כרגע
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">
          פרויקטים פעילים <span className="text-gray-400 font-normal">({projects.length})</span>
        </div>
        <span className="text-xs text-gray-400">מסודר לפי פעילות אחרונה</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-3 py-2 font-medium text-gray-600" style={{ width: '26%' }}>לקוח</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600" style={{ width: '32%' }}>פרויקט</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600" style={{ width: '22%' }}>סטטוס</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600" style={{ width: '14%' }}>נוצר</th>
              <th style={{ width: '6%' }}></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.project_id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-gray-900">{p.customer_name}</td>
                <td className="px-3 py-3 text-gray-600 truncate" title={p.project_title}>{p.project_title}</td>
                <td className="px-3 py-3">
                  <span className={'inline-block text-xs px-2.5 py-0.5 rounded-full ' + statusBadgeClasses(p.project_status)}>
                    {p.project_status}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs">{formatIsraeliDate(p.project_created_at)}</td>
                <td className="px-3 py-3 text-left">
                  <Link
                    href={`/customers/${p.customer_id}`}
                    className="text-blue-600 hover:underline no-underline"
                    aria-label={`פתח את פרויקט ${p.project_title}`}
                  >
                    ←
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
