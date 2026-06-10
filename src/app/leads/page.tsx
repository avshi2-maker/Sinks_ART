// src/app/leads/page.tsx
// Phase 37 — Leads Inbox page.

import Link from 'next/link';
import { fetchLeads, fetchCustomersLite } from '@/lib/leads/leadsData';
import LeadsInbox from '@/components/leads/LeadsInbox';
import PastedLeadIntake from '@/components/leads/PastedLeadIntake';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadsPage() {
  const leads = await fetchLeads();
  const customers = await fetchCustomersLite();
  const newCount = leads.filter((l) => !l.converted_to_customer_id).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📥</div>
          <div>
            <div className="text-lg font-medium text-stone-900">פניות מהאתר</div>
            <div className="text-xs text-stone-500">{newCount} פניות חדשות · {leads.length} סה"כ</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>
      <PastedLeadIntake />
      <LeadsInbox leads={leads} customers={customers} />
    </div>
  );
}
