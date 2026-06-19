'use client';

// src/components/pipeline/PipelineBoard.tsx
// Command center: status tiles (count + ₪ per stage) + filterable job table with
// stage-advance controls. Option B layout. RTL.
import { useState, useMemo, useTransition } from 'react';
import { advanceJobStage, deleteJob } from '@/lib/pipeline/jobPipelineData';
import { JobRow, JobStage, STAGE_META, STAGE_ORDER, PipelineSummary } from '@/lib/pipeline/jobPipelineTypes';

function ils(n: number): string { return '₪' + (Number(n) || 0).toLocaleString(); }
function dateHe(iso: string | null): string { return iso ? new Date(iso).toLocaleDateString('he-IL') : '—'; }

export default function PipelineBoard({ jobs, summary }: { jobs: JobRow[]; summary: PipelineSummary }) {
  const [filter, setFilter] = useState<JobStage | 'all' | 'active'>('active');
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'active') return jobs.filter((j) => STAGE_META[j.stage as JobStage]?.active);
    return jobs.filter((j) => j.stage === filter);
  }, [jobs, filter]);

  function nextStage(s: JobStage): JobStage | null {
    const flow: JobStage[] = ['priced', 'offer_sent', 'ordered', 'delivered', 'paid'];
    const i = flow.indexOf(s);
    if (i >= 0 && i < flow.length - 1) return flow[i + 1];
    if (s === 'new_lead') return 'awaiting_ales';
    if (s === 'awaiting_ales') return 'priced';
    return null;
  }

  function advance(id: string, to: JobStage, title: string) {
    if (!confirm('להעביר את "' + title + '" לשלב: ' + STAGE_META[to].label + ' ?')) return;
    setBusyId(id);
    startTransition(async () => { await advanceJobStage(id, to); setBusyId(null); });
  }
  function markLost(id: string, title: string) {
    if (!confirm('לסמן את "' + title + '" כאבוד?')) return;
    setBusyId(id);
    startTransition(async () => { await advanceJobStage(id, 'lost'); setBusyId(null); });
  }
  function remove(id: string) {
    if (!confirm('למחוק את העבודה לצמיתות?')) return;
    setBusyId(id);
    startTransition(async () => { await deleteJob(id); setBusyId(null); });
  }

  return (
    <div dir="rtl">
      {/* headline money tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">עבודות פעילות</div>
          <div className="text-2xl font-bold text-stone-900">{summary.activeCount}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">שווי פעיל (ללקוח)</div>
          <div className="text-2xl font-bold text-blue-700">{ils(summary.activeValue)}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">עמלה צפויה (פעיל)</div>
          <div className="text-2xl font-bold text-purple-700">{ils(summary.commissionActive)}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">שולם — סה"כ</div>
          <div className="text-2xl font-bold text-emerald-700">{ils(summary.paidValueAll)}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">עמלה שנגבתה</div>
          <div className="text-2xl font-bold text-amber-600">{ils(summary.commissionPaidAll)}</div>
        </div>
      </div>

      {/* per-stage filter tiles */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setFilter('active')} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === 'active' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>
          פעילות
        </button>
        <button onClick={() => setFilter('all')} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>
          הכל ({jobs.length})
        </button>
        {STAGE_ORDER.map((s) => {
          const m = STAGE_META[s];
          const c = summary.byStage[s]?.count || 0;
          return (
            <button key={s} onClick={() => setFilter(s)} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === s ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>
              <span className={'inline-block w-2 h-2 rounded-full me-1 ' + m.cls.split(' ')[0]}></span>
              {m.short} ({c})
            </button>
          );
        })}
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-8 text-center text-stone-400 text-sm">אין עבודות בקטגוריה זו</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          {filtered.map((j) => {
            const m = STAGE_META[j.stage as JobStage] || STAGE_META.priced;
            const nxt = nextStage(j.stage as JobStage);
            const isBusy = busyId === j.id && pending;
            return (
              <div key={j.id} className="border-b border-stone-100 last:border-0 p-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={'text-[11px] px-2 py-0.5 rounded-full font-medium ' + m.cls}>{m.label}</span>
                      <span className="font-semibold text-stone-900 text-sm break-words">{j.title_he}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {[j.customer_name, j.customer_phone, j.customer_city].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      עלות אלס {ils(j.ales_cost)} · ללקוח {ils(j.customer_total)} · עמלה {ils(j.commission)} · עודכן {dateHe(j.updated_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {nxt && j.stage !== 'paid' && j.stage !== 'lost' && (
                      <button onClick={() => advance(j.id, nxt, j.title_he)} disabled={isBusy} className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">
                        → {STAGE_META[nxt].short}
                      </button>
                    )}
                    {j.stage !== 'lost' && j.stage !== 'paid' && (
                      <button onClick={() => markLost(j.id, j.title_he)} disabled={isBusy} className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                        אבוד
                      </button>
                    )}
                    <button onClick={() => remove(j.id)} disabled={isBusy} className="text-xs px-2 py-1 rounded-md text-stone-300 hover:text-red-600 disabled:opacity-50">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
