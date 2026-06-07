'use client';

// src/components/customers/CustomersTable.tsx
// Phase 19 Stage B + Phase 22 — searchable customer list with archive action.

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CustomerSummary } from '@/lib/customers/fetchCustomersList';
import { archiveCustomer } from '@/lib/customers/customerMutations';

interface Props {
  customers: CustomerSummary[];
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 7)  return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
}

export default function CustomersTable({ customers }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = [c.name_he, c.name_en || '', c.phone || '', c.email || '', c.city || ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [customers, query]);

  async function handleArchive(id: string, name: string) {
    if (!window.confirm(`להסיר את "${name}" מהרשימה? הנתונים נשמרים וניתן לשחזר במסד הנתונים.`)) return;
    setBusyId(id);
    const res = await archiveCustomer(id);
    setBusyId(null);
    if (!res.ok) { window.alert('ההסרה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון, עיר..."
          className="w-full px-4 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white"
          dir="rtl"
        />
        {query && (
          <div className="text-xs text-stone-500 mt-1 px-1">מציג {filtered.length} מתוך {customers.length}</div>
        )}
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-right">
                <th className="py-2 px-3 font-medium">שם</th>
                <th className="py-2 px-3 font-medium">טלפון</th>
                <th className="py-2 px-3 font-medium">עיר</th>
                <th className="py-2 px-3 font-medium text-center">פרויקטים</th>
                <th className="py-2 px-3 font-medium text-center">תקשורת</th>
                <th className="py-2 px-3 font-medium">פעילות אחרונה</th>
                <th className="py-2 px-3 font-medium">סטטוס</th>
                <th className="py-2 px-3 font-medium text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-sm text-stone-500">אין תוצאות תואמות לחיפוש</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-blue-700 no-underline hover:underline">{c.name_he}</Link>
                      {c.name_en && (<div className="text-xs text-stone-500 mt-0.5" dir="ltr">{c.name_en}</div>)}
                    </td>
                    <td className="py-3 px-3 text-stone-700" dir="ltr">{c.phone || '—'}</td>
                    <td className="py-3 px-3 text-stone-700">{c.city || '—'}</td>
                    <td className="py-3 px-3 text-center text-stone-900 font-medium">{c.project_count}</td>
                    <td className="py-3 px-3 text-center text-stone-900 font-medium">{c.comm_count}</td>
                    <td className="py-3 px-3 text-stone-600 text-xs">{formatRelativeDate(c.last_comm_at)}</td>
                    <td className="py-3 px-3">
                      {c.is_active ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">פעיל</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-600">לא פעיל</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => handleArchive(c.id, c.name_he)} disabled={busyId === c.id} className="text-stone-400 hover:text-red-600 disabled:opacity-40" title="הסר מהרשימה">
                        {busyId === c.id ? '…' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
