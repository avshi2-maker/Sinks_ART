// src/app/sites/page.tsx
// Phase 34 — sites list (parent entities holding projects, e.g. hotels).

import Link from 'next/link';
import { fetchSites } from '@/lib/sites/sitesData';
import AddSiteForm from '@/components/sites/AddSiteForm';
import DeleteSiteButton from '@/components/sites/DeleteSiteButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString('he-IL'); }

export default async function SitesPage() {
  const sites = await fetchSites();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🏨</div>
          <div>
            <div className="text-base font-medium text-stone-900">אתרים <span className="text-stone-400 font-normal">({sites.length})</span></div>
            <div className="text-xs text-stone-500">פרויקטים גדולים המאגדים כמה עבודות (מלונות, מבנים)</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <AddSiteForm />

      {sites.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">אין אתרים עדיין. צור את הראשון.</div>
      ) : (
        <div className="space-y-2">
          {sites.map((s) => (
            <Link key={s.id} href={`/sites/${s.id}`} className="block bg-white border border-stone-200 rounded-lg p-3 hover:border-blue-300 transition-colors no-underline">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-stone-900">{s.name_he}</div>
                  {s.address_he && (<div className="text-xs text-stone-500">{s.address_he}</div>)}
                </div>
                <div className="text-left flex items-center gap-2"><DeleteSiteButton siteId={s.id} siteName={s.name_he} />
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{s.status}</span>
                  <div className="text-xs text-stone-400 mt-1">{fmtDate(s.created_at)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
