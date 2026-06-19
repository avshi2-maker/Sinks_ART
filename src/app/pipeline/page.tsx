// src/app/pipeline/page.tsx
// Pipeline command center: status tiles + filterable job table. Option B.
import { listJobs, pipelineSummary } from '@/lib/pipeline/jobPipelineData';
import PipelineBoard from '@/components/pipeline/PipelineBoard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PipelinePage() {
  const [jobs, summary] = await Promise.all([listJobs(), pipelineSummary()]);
  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-stone-800">צנרת עבודות</h1>
        <p className="text-sm text-stone-500 mt-1">מעקב אחר כל עבודה — מליד ועד תשלום</p>
      </div>
      <PipelineBoard jobs={jobs} summary={summary} />
    </div>
  );
}
