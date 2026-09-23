// src/app/case-studies/[id]/page.tsx · updated 23.09.2026 10:36 (Asia/Jerusalem)
// One case study: facts, generate, edit, gates, publish.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchCase, isSlugTaken } from '@/lib/case/caseData';
import { fetchCustomersLite } from '@/lib/leads/leadsData';
import CaseEditor from '@/components/case/CaseEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await fetchCase(id);
  if (!c) notFound();
  const customers = await fetchCustomersLite();
  const slugTaken = await isSlugTaken(c.gen?.slug || '', c.id);
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4" dir="rtl">
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="text-lg font-medium text-stone-900">📂 {c.gen?.title || c.title_raw || 'תיק פרויקט'}</div>
        <Link href="/case-studies" className="text-sm text-blue-600 no-underline hover:underline">← כל התיקים</Link>
      </div>
      <CaseEditor c={c} customers={customers.map((u) => ({ id: u.id, name_he: u.name_he }))} slugTaken={slugTaken} />
    </div>
  );
}
