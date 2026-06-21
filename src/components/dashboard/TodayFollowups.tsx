// src/components/dashboard/TodayFollowups.tsx
// "מעקב היום" — the daily follow-ups landing block. Surfaces what needs action NOW:
// site tasks due today/overdue (top, red-flagged), offers sent & waiting (days waiting),
// and jobs needing a next step. Server component; degrades gracefully if a source is empty.
import Link from 'next/link';
import { listJobs } from '@/lib/pipeline/jobPipelineData';
import { STAGE_META, JobStage } from '@/lib/pipeline/jobPipelineTypes';
import { fetchDueSiteTasks } from '@/lib/sites/sitesData';
import type { DueSiteTask } from '@/lib/sites/sitesData';

function ils(n: number): string { return '₪' + (Number(n) || 0).toLocaleString(); }
function daysAgo(iso: string | null): { n: number; label: string } {
  if (!iso) return { n: 0, label: '' };
  const n = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (n <= 0) return { n, label: 'היום' };
  if (n === 1) return { n, label: 'אתמול' };
  return { n, label: 'לפני ' + n + ' ימים' };
}
function dueInfo(due: string): { overdue: boolean; label: string } {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  if (due >= todayStr) return { overdue: false, label: 'להיום' };
  const n = Math.round((new Date(todayStr).getTime() - new Date(due).getTime()) / 86400000);
  return { overdue: true, label: n === 1 ? 'באיחור יום' : 'באיחור ' + n + ' ימים' };
}

export default async function TodayFollowups() {
  let jobs: Awaited<ReturnType<typeof listJobs>> = [];
  try { jobs = await listJobs(); } catch { jobs = []; }
  let dueTasks: DueSiteTask[] = [];
  try { dueTasks = await fetchDueSiteTasks(); } catch { dueTasks = []; }

  // Offers sent & waiting — sorted oldest-waiting first.
  const waiting = jobs
    .filter((j) => j.stage === 'offer_sent')
    .sort((a, b) => {
      const da = a.offer_sent_at ? new Date(a.offer_sent_at).getTime() : 0;
      const db = b.offer_sent_at ? new Date(b.offer_sent_at).getTime() : 0;
      return da - db;
    });

  const needStep = jobs.filter((j) => j.stage === 'priced' || j.stage === 'awaiting_ales' || j.stage === 'new_lead');

  if (waiting.length === 0 && needStep.length === 0 && dueTasks.length === 0) return null;

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 mb-3" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-800">📌 מעקב היום</h2>
        <Link href="/pipeline" className="text-xs text-blue-600 hover:underline">לצנרת המלאה ←</Link>
      </div>

      {dueTasks.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] font-semibold text-red-700 mb-1.5">משימות להיום ({dueTasks.length})</div>
          <div className="space-y-1">
            {dueTasks.slice(0, 6).map((t) => {
              const info = dueInfo(t.due_date);
              return (
                <Link key={t.id} href={'/sites/' + t.site_id} className="flex items-center justify-between gap-2 text-xs hover:bg-stone-50 rounded px-1.5 py-1.5 border-r-2 border-red-300">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-stone-700 font-medium truncate">{t.title_he}</span>
                    {t.site_name && (<span className="text-stone-400 truncate hidden sm:inline">· {t.site_name}</span>)}
                  </span>
                  <span className={'shrink-0 ' + (info.overdue ? 'text-red-600 font-semibold' : 'text-orange-600 font-medium')}>{info.label}</span>
                </Link>
              );
            })}
            {dueTasks.length > 6 && (<div className="text-[11px] text-stone-400 px-1.5">+ עוד {dueTasks.length - 6}…</div>)}
          </div>
        </div>
      )}

      {waiting.length > 0 && (
        <div className="mb-3 border-t border-stone-100 pt-2">
          <div className="text-[11px] font-semibold text-amber-700 mb-1.5">הצעות שיצאו וממתינות לתשובה ({waiting.length})</div>
          <div className="space-y-1">
            {waiting.slice(0, 6).map((j) => {
              const d = daysAgo(j.offer_sent_at);
              const overdue = d.n >= 4;
              return (
                <Link key={j.id} href="/pipeline" className="flex items-center justify-between gap-2 text-xs hover:bg-stone-50 rounded px-1.5 py-1.5 border-r-2 border-amber-300">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-stone-700 font-medium truncate">{j.title_he}</span>
                    {j.customer_name && (<span className="text-stone-400 truncate hidden sm:inline">· {j.customer_name}</span>)}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-stone-500">{ils(j.customer_total)}</span>
                    <span className={overdue ? 'text-red-600 font-semibold' : 'text-amber-600'}>{d.label}</span>
                  </span>
                </Link>
              );
            })}
            {waiting.length > 6 && (<div className="text-[11px] text-stone-400 px-1.5">+ עוד {waiting.length - 6}…</div>)}
          </div>
        </div>
      )}

      {needStep.length > 0 && (
        <div className="border-t border-stone-100 pt-2">
          <div className="text-[11px] font-semibold text-stone-500 mb-1.5">דורש צעד הבא ({needStep.length})</div>
          <div className="space-y-1">
            {needStep.slice(0, 4).map((j) => {
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
            {needStep.length > 4 && (<div className="text-[11px] text-stone-400 px-1.5">+ עוד {needStep.length - 4}…</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
