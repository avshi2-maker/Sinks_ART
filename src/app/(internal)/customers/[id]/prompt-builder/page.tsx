// src/app/(internal)/customers/[id]/prompt-builder/page.tsx
import { createClient } from '@supabase/supabase-js';
import PromptBuilderShell from '@/components/prompt-builder/PromptBuilderShell';
import type { MediaAnalysis } from '@/lib/supabase';

export const metadata = {
  title: 'בונה פרומפטים ללקוח | Sinks ART',
};

async function fetchCustomerMedia(customerId: string): Promise<MediaAnalysis[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('media_analyses')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as MediaAnalysis[];
}

export default async function CustomerPromptBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mediaAnalyses = await fetchCustomerMedia(id);

  return <PromptBuilderShell mode="per-customer" customerId={id} mediaAnalyses={mediaAnalyses} />;
}