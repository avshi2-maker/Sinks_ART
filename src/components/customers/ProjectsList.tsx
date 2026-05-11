// src/components/customers/ProjectsList.tsx
// Phase 16 — Projects table for a customer.
// Phase 19 Stage B step 5 - Status badge is now interactive (ProjectStatusBadge).
// Server component shell; only the status badge cell is a client component.

import type { ProjectRow } from '@/lib/customers/types';
import ProjectStatusBadge from './ProjectStatusBadge';

interface Props {
  projects:   ProjectRow[];
  customerId: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL');
}

function formatIls(amount: number | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProjectsList({ projects, customerId }: Props) {
  if (projects.length === 0) {
    return (
      <section className="bg-white border border-stone-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-2">פרויקטים</h2>
        <p className="text-sm text-stone-500">אין פרויקטים ללקוח זה.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-900 mb-4">
        פרויקטים ({projects.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-600 text-right">
              <th className="py-2 px-2 font-medium">כותרת</th>
              <th className="py-2 px-2 font-medium">סטטוס</th>
              <th className="py-2 px-2 font-medium">פנייה</th>
              <th className="py-2 px-2 font-medium">הצעה</th>
              <th className="py-2 px-2 font-medium">מסירה</th>
              <th className="py-2 px-2 font-medium">סכום</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.id}
                className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="font-medium text-stone-900">{p.title_he}</div>
                  {p.description_he ? (
                    <div className="text-xs text-stone-500 mt-1 line-clamp-1">
                      {p.description_he}
                    </div>
                  ) : null}
                </td>
                <td className="py-3 px-2">
                  <ProjectStatusBadge
                    projectId={p.id}
                    customerId={customerId}
                    currentStatus={p.status}
                  />
                </td>
                <td className="py-3 px-2 text-stone-700">
                  {formatDate(p.inquiry_date)}
                </td>
                <td className="py-3 px-2 text-stone-700">
                  {formatDate(p.quote_sent_date)}
                </td>
                <td className="py-3 px-2 text-stone-700">
                  {formatDate(p.delivery_date)}
                </td>
                <td className="py-3 px-2 text-stone-900 font-medium">
                  {formatIls(p.quoted_price_ils)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
