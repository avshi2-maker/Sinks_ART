// src/app/(internal)/prompt-builder/page.tsx
import { Suspense } from 'react';
import PromptBuilderShell from '@/components/prompt-builder/PromptBuilderShell';

export const metadata = {
  title: 'בונה פרומפטים להדמיה | Sinks ART',
};

export default function PromptBuilderPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400" dir="rtl">טוען…</div>}>
      <PromptBuilderShell mode="standalone" />
    </Suspense>
  );
}