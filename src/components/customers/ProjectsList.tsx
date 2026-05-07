// src/components/customers/ProjectsList.tsx
// Phase 16 — Projects table for a customer.
// Server component (pure display).

import type { ProjectRow } from '@/lib/customers/types';

interface Props {
  projects: ProjectRow[];
}

const STATUS_COLORS: Record<string, string> = {
  'ליד': 'bg-amber-100 text-amber-800',
  'הצעה נשלחה': 'bg-blue-100 text-blue-800',
  'מאושר': 'bg-indigo-100 text-indigo-800',
  'בייצור': 'bg-purple-100 text-purple-800',
  'נמסר': 'bg-teal-100 text-teal-800',
  'הושלם': 'bg-green-100 text-green-800',
  'בוטל': 'bg-red-100 text-red-800',
};

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

export function ProjectsList({ projects }: Props) {
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
            {projects.map((p) => {
              const statusClass = STATUS_COLORS[p.status] ?? 'bg-stone-100 text-stone-700';
              return (
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
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                    >
                      {p.status}
                    </span>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
