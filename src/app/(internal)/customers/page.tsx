// src/app/(internal)/customers/page.tsx
// Phase 19 Stage B — Customers index page.
// Lists all customers with project/comm counts + last activity.
// Lives in (internal) route group → inherits TopNav automatically.

import Link from 'next/link';
import { fetchCustomersList } from '@/lib/customers/fetchCustomersList';
import CustomersTable from '@/components/customers/CustomersTable';

export const dynamic = 'force-dynamic';

export default async function CustomersIndexPage() {
  const customers = await fetchCustomersList();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" dir="rtl">
      {/* Page header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">👥</div>
          <div>
            <div className="text-base font-medium text-stone-900">
              לקוחות <span className="text-stone-400 font-normal">({customers.length})</span>
            </div>
            <div className="text-xs text-stone-500">רשימת כל הלקוחות, ממוינים לפי פעילות אחרונה</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">
          ← חזרה ללוח הבקרה
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">
          אין לקוחות עדיין. הוסף לקוח דרך אינטייק או דרך /sinc.
        </div>
      ) : (
        <CustomersTable customers={customers} />
      )}
    </div>
  );
}
