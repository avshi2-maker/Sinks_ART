// src/components/dashboard/DashboardPipelineStrip.tsx
// Compact pipeline summary on the main dashboard: money tiles + needs-attention
// count + link to the full /pipeline command center. Server component.
import Link from 'next/link';
import { listJobs, pipelineSummary } from '@/lib/pipeline/jobPipelineData';
import { STAGE_META, JobStage } from '@/lib/pipeline/jobPipelineTypes';

function ils(n: number): string { return '₪' + (Number(n) || 0).toLocaleString(); }

export default async function DashboardPipelineStrip() {
  let jobs, summary;
  try {
    [jobs, summary] = await Promise.all([listJobs(), pipelineSummary()]);
  } catch {
    return null; // fail silently on the dashboard
  }

  // jobs that need action right now: priced (need offer) + offer_sent (chase) + awaiting_ales
  const needAttention = jobs.filter((j) => ['priced', 'awaiting_ales', 'offer_sent'].includes(j.stage));

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 mb-3" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-800">🔧 צנרת עבודות</h2>
        <Link href="/pipeline" className="text-xs text-blue-600 hover:underline">לכל העבודות ←</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-stone-50 rounded-md p-2.5">
          <div className="text-[11px] text-stone-500">עבודות פעילות</div>
          <div className="text-xl font-bold text-stone-900">{summary.activeCount}</div>
        </div>
        <div className="bg-blue-50 rounded-md p-2.5">
          <div className="text-[11px] text-stone-500">שווי פעיל</div>
          <div className="text-xl font-bold text-blue-700">{ils(summary.activeValue)}</div>
        </div>
        <div className="bg-purple-50 rounded-md p-2.5">
          <div className="text-[11px] text-stone-500">עמלה צפויה</div>
          <div className="text-xl font-bold text-purple-700">{ils(summary.commissionActive)}</div>
        </div>
        <div className="bg-emerald-50 rounded-md p-2.5">
          <div className="text-[11px] text-stone-500">עמלה שנגבתה</div>
          <div className="text-xl font-bold text-emerald-700">{ils(summary.commissionPaidAll)}</div>
        </div>
      </div>

      {needAttention.length > 0 && (
        <div className="mt-3 border-t border-stone-100 pt-2">
          <div className="text-[11px] font-semibold text-stone-500 mb-1.5">דורש טיפול ({needAttention.length})</div>
          <div className="space-y-1">
            {needAttention.slice(0, 4).map((j) => {
              const m = STAGE_META[j.stage as JobStage];
              return (
                <Link key={j.id} href="/pipeline" className="flex items-center justify-between gap-2 text-xs hover:bg-stone-50 rounded px-1.5 py-1">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ' + m.cls}>{m.short}</span>
                    <span className="text-stone-700 truncate">{j.title_he}</span>
                  </span>
                  <span className="text-stone-400 shrink-0">{ils(j.customer_total)}</span>
                </Link>
              );
            })}
            {needAttention.length > 4 && (<div className="text-[11px] text-stone-400 px-1.5">+ עוד {needAttention.length - 4}…</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
