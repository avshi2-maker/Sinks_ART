// src/app/customers/[id]/page.tsx
// Phase 16 — Customer detail page.
// Route: /customers/[id]   e.g. /customers/626efdd8-bacc-44fd-974d-7cfe5574736d
// Server component (async).

import { notFound } from 'next/navigation';
import { fetchCustomerPage } from '@/lib/customers/fetchCustomerPage';
import { CustomerHeader } from '@/components/customers/CustomerHeader';
import { ProjectsList } from '@/components/customers/ProjectsList';
import { CommsTimeline } from '@/components/customers/CommsTimeline';

// Always render fresh — Phase D writes happen anytime a /sinc save runs.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchCustomerPage(id);

  if (!data) {
    notFound();
  }

  return (
    <main dir="rtl" lang="he" className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="mb-6 text-sm">
          <a
            href="/dashboard"
            className="text-stone-500 hover:text-stone-700 transition-colors"
          >
            ← חזרה ללוח הבקרה
          </a>
        </nav>

        <CustomerHeader customer={data.customer} />
        <ProjectsList projects={data.projects} />
        <CommsTimeline comms={data.comms} />

        <footer className="text-center text-xs text-stone-400 mt-8">
          Customer ID: <code dir="ltr">{data.customer.id}</code>
        </footer>
      </div>
    </main>
  );
}
