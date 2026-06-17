// src/app/rfq-create/page.tsx
// Avshi-side tool: create an RFQ for Ales, get a shareable link.
import Link from 'next/link';
import RfqCreateForm from '@/components/rfq/RfqCreateForm';
import { listRecentRfqs } from '@/lib/rfq/rfqData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RfqCreatePage() {
  const recent = await listRecentRfqs(10);
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🏭</div>
          <div>
            <div className="text-base font-medium text-stone-900">צור RFQ לאלס</div>
            <div className="text-xs text-stone-500">בנה בקשת תמחור · קבל קישור לשליחה בוואטסאפ</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <RfqCreateForm />

      {recent.length > 0 && (
        <div className="mt-8">
          <div className="text-sm font-semibold text-stone-700 mb-2">RFQ אחרונים</div>
          <div className="space-y-2">
            {recent.map((r) => (
              <div key={r.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-stone-800">{r.title_he}</div>
                  <div className="text-xs text-stone-500">{r.project_ref || '—'} · {r.status}</div>
                </div>
                <CopyLink token={r.token} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyLink({ token }: { token: string }) {
  return (
    <a href={'/rfq/' + token} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">פתח קישור ←</a>
  );
}
