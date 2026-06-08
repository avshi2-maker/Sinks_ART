// src/app/(internal)/customers/[id]/page.tsx
// Phase 16 — Customer detail page.
// Phase 19 Stage B — Filter tabs on comms timeline (reads ?type= URL param).
// Phase 27 — Quick Quote panel (הצעה מהירה).
import { notFound } from 'next/navigation';
import { fetchCustomerPage } from '@/lib/customers/fetchCustomerPage';
import { CustomerHeader } from '@/components/customers/CustomerHeader';
import { ProjectsList } from '@/components/customers/ProjectsList';
import { CommsTimeline } from '@/components/customers/CommsTimeline';
import CommsFilterTabs, { CommFilterValue } from '@/components/customers/CommsFilterTabs';
import AddNoteInlineForm from '@/components/customers/AddNoteInlineForm';
import CorrespondenceSorter from '@/components/sorter/CorrespondenceSorter';
import QuickQuotePanel from '@/components/quotes/QuickQuotePanel';
import { fetchActiveOptions } from '@/lib/options/optionsCatalog';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}
export default async function CustomerPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const filter = (sp.type || 'all') as CommFilterValue;
  const data = await fetchCustomerPage(id);
  const catalogOptions = await fetchActiveOptions();
  if (!data) {
    notFound();
  }
  const counts: Partial<Record<CommFilterValue, number>> = {};
  for (const c of data.comms) {
    const key = (c.comm_type === 'sketch' ? 'photo' : c.comm_type) as CommFilterValue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return (
    <main dir="rtl" lang="he" className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="mb-6 text-sm">
          <a href="/dashboard" className="text-stone-500 hover:text-stone-700 transition-colors">
            ← חזרה ללוח הבקרה
          </a>
        </nav>
        <CustomerHeader customer={data.customer} />
        <ProjectsList projects={data.projects} customerId={data.customer.id} />
        <QuickQuotePanel customerId={data.customer.id} customerName={data.customer.name_he} customerPhone={data.customer.phone} projects={data.projects.map(p => ({ id: p.id, title_he: p.title_he }))} catalogOptions={catalogOptions} />
        <CorrespondenceSorter customerId={data.customer.id} projects={data.projects.map(p => ({ id: p.id, title_he: p.title_he }))} />
        <AddNoteInlineForm customerId={data.customer.id} projects={data.projects.map(p => ({ id: p.id, title_he: p.title_he }))} />
        <CommsFilterTabs counts={counts} totalCount={data.comms.length} />
        <CommsTimeline comms={data.comms} filter={filter} />
        <footer className="text-center text-xs text-stone-400 mt-8">
          Customer ID: <code dir="ltr">{data.customer.id}</code>
        </footer>
      </div>
    </main>
  );
}
