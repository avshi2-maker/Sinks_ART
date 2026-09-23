// src/app/case-studies/page.tsx · updated 23.09.2026 16:51 (Asia/Jerusalem)
// 📂 Case studies inbox: finished Ales jobs → generate → validate → publish to marble-art.co.il/projects.

import Link from 'next/link';
import { fetchCases, syncFromAles, fetchOpenAlesJobs } from '@/lib/case/caseData';
import OpenAlesJobs from '@/components/case/OpenAlesJobs';
import { STATUS_HE, TYPE_HE, publishedImages, SITE_URL } from '@/lib/case/caseTypes';
import type { CaseStatus } from '@/lib/case/caseTypes';
import SyncButton from '@/components/case/SyncButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ST_CLS: Record<CaseStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  generated: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-stone-200 text-stone-600',
};
const card = 'flex gap-3 items-stretch bg-white border border-stone-200 rounded-lg p-3 no-underline hover:border-indigo-400';

function d(iso: string | null) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' }); } catch { return ''; }
}

export default async function CaseStudiesPage() {
  const sync = await syncFromAles();
  const cases = await fetchCases();
  const openJobs = await fetchOpenAlesJobs();
  const order: CaseStatus[] = ['new', 'generated', 'published', 'archived'];
  const count = (s: CaseStatus) => cases.filter((c) => c.status === s).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📂</div>
          <div>
            <div className="text-lg font-medium text-stone-900">תיקי פרויקט</div>
            <div className="text-xs text-stone-500">{order.map((s) => STATUS_HE[s] + ' ' + count(s)).join(' · ')}</div>
          </div>
        </div>
        <SyncButton />
      </div>

      {!sync.ok && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-md p-3">{sync.error}</div>}
      {sync.ok && sync.added > 0 && <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-3">✓ נוספו {sync.added} עבודות חדשות מאלס</div>}

      <OpenAlesJobs jobs={openJobs} />

      {cases.length === 0 && <div className="p-8 text-center text-stone-500 text-sm bg-white border border-stone-200 rounded-lg">עדיין אין עבודות שהסתיימו. כשאלס לוחץ ״שמור וסיים״ באפליקציה, העבודה תופיע כאן.</div>}

      <div className="flex flex-col gap-2">
        {order.flatMap((s) => cases.filter((c) => c.status === s)).map((c) => {
          const img = publishedImages(c)[0];
          const title = c.gen?.title || c.title_raw || 'ללא כותרת';
          return (
            <Link key={c.id} href={'/case-studies/' + c.id} className={card}>
              {img ? <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-md shrink-0" /> : <div className="w-20 h-20 rounded-md bg-stone-100 shrink-0" />}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={'text-[11px] font-semibold px-2 py-0.5 rounded ' + ST_CLS[c.status]}>{STATUS_HE[c.status]}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600">{TYPE_HE[c.job_type || ''] || c.job_type}</span>
                  {Object.keys(c.social_log || {}).length > 0 && <span className="text-[11px] px-2 py-0.5 rounded bg-violet-100 text-violet-800">📣 {Object.keys(c.social_log || {}).length}/3 ברשתות</span>}
                  {(c.sketches || []).length > 0 && <span className="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-800">📐 {(c.sketches || []).length} שרטוטים</span>}
                  {c.voice?.url && <span className="text-[11px] px-2 py-0.5 rounded bg-violet-100 text-violet-800">🎙️ {c.transcript ? 'תומלל' : 'הקלטה'}</span>}
                </div>
                <div className="text-sm font-medium text-stone-900 truncate">{title}</div>
                <div className="text-xs text-stone-500">{[c.city, c.customer_name, 'הסתיים ' + d(c.finish_date)].filter(Boolean).join(' · ')}</div>
                {c.status === 'published' && c.slug && <div className="text-xs text-emerald-700 font-mono truncate" dir="ltr">{SITE_URL.replace('https://', '')}/projects/{c.slug}</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
