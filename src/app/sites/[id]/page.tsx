// src/app/sites/[id]/page.tsx
// Phase 34 — site detail: header, projects roll-up, + interactive contacts/tasks/visits.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchSite } from '@/lib/sites/sitesData';
import SiteContacts from '@/components/sites/SiteContacts';
import SiteTasks from '@/components/sites/SiteTasks';
import SiteVisits from '@/components/sites/SiteVisits';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ils(n: number | null): string { return '₪' + (Math.round(n || 0)).toLocaleString('he-IL'); }

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await fetchSite(id);
  if (!site) notFound();

  const projectsTotal = site.projects.reduce((s, p) => s + (Number(p.quoted_price_ils) || 0), 0);
  const openTasks = site.tasks.filter((t) => !t.done).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🏨</div>
          <div>
            <div className="text-lg font-medium text-stone-900">{site.name_he}</div>
            {site.address_he && (<div className="text-xs text-stone-500">{site.address_he}</div>)}
          </div>
        </div>
        <Link href="/sites" className="text-sm text-blue-600 no-underline hover:underline">← כל האתרים</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-stone-200 rounded-lg p-3"><div className="text-xs text-stone-500">פרויקטים</div><div className="text-xl font-semibold text-stone-900">{site.projects.length}</div></div>
        <div className="bg-white border border-stone-200 rounded-lg p-3"><div className="text-xs text-stone-500">סה"כ מוצע</div><div className="text-xl font-semibold text-stone-900">{ils(projectsTotal)}</div></div>
        <div className="bg-white border border-stone-200 rounded-lg p-3"><div className="text-xs text-stone-500">משימות פתוחות</div><div className="text-xl font-semibold text-stone-900">{openTasks}</div></div>
        <div className="bg-white border border-stone-200 rounded-lg p-3"><div className="text-xs text-stone-500">ביקורים</div><div className="text-xl font-semibold text-stone-900">{site.visits.length}</div></div>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-2">פרויקטים באתר ({site.projects.length})</h2>
        {site.projects.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין פרויקטים מקושרים עדיין.</div>
        ) : (
          <div className="space-y-1.5">
            {site.projects.map((p) => (
              <div key={p.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-stone-800">{p.title_he}</span>
                <span className="text-xs text-stone-500">{p.status} · {ils(p.quoted_price_ils)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <SiteContacts siteId={site.id} contacts={site.contacts} />
      <SiteTasks siteId={site.id} tasks={site.tasks} />
      <SiteVisits siteId={site.id} visits={site.visits} />
    </div>
  );
}
