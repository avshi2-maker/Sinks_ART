// src/app/(internal)/prompt-builder/page.tsx
import { Suspense } from 'react';
import PromptBuilderShell from '@/components/prompt-builder/PromptBuilderShell';
import { fetchSketchGallery } from '@/lib/demos/demosData';

export const metadata = {
  title: 'בונה פרומפטים להדמיה | Sinks ART',
};

export const dynamic = 'force-dynamic';

export default async function PromptBuilderPage() {
  const sketches = await fetchSketchGallery();
  return (
    <Suspense fallback={<div className="p-6 text-slate-400" dir="rtl">טוען…</div>}>
      <PromptBuilderShell mode="standalone" sketches={sketches} />
    </Suspense>
  );
}