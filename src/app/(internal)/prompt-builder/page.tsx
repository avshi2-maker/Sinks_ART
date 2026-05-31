// src/app/(internal)/prompt-builder/page.tsx
import PromptBuilderShell from '@/components/prompt-builder/PromptBuilderShell';

export const metadata = {
  title: 'בונה פרומפטים להדמיה | Sinks ART',
};

export default function PromptBuilderPage() {
  return <PromptBuilderShell mode="standalone" />;
}