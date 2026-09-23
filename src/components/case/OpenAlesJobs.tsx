'use client';
// src/components/case/OpenAlesJobs.tsx · updated 23.09.2026 16:51 (Asia/Jerusalem)
// 🛠️ Jobs Ales opened but hasn't finished yet (read-only, live from the Ales app) + their sketches.

import SketchCracker from './SketchCracker';

export interface OpenJob { id: string; title: string | null; city: string | null; customer: string | null; job_type: string; created_at: string; media: { url: string; type?: string }[]; sketches: { url: string }[]; fields: Record<string, unknown> }

const TYPE_HE: Record<string, string> = { sinks: 'כיורים', renovation: 'שיפוצים', doors: 'דלתות שיש' };
function d(iso: string) { try { return new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' }); } catch { return ''; } }

export default function OpenAlesJobs({ jobs }: { jobs: OpenJob[] }) {
  if (!jobs.length) return null;
  return (
    <details open className="bg-white border border-amber-200 rounded-lg">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-amber-900 bg-amber-50 rounded-t-lg">🛠️ בביצוע אצל אלס ({jobs.length}) — עוד לא הסתיימו</summary>
      <div className="flex flex-col gap-2 p-3">
        {jobs.map((j) => {
          const img = (j.media || []).find((m) => !m.type || m.type === 'image');
          const story = typeof j.fields?.story === 'string' ? j.fields.story : '';
          return (
            <div key={j.id} className="border border-stone-200 rounded-md p-2 flex flex-col gap-2">
              <div className="flex gap-3 items-start">
                {img ? <img src={img.url} alt="" className="w-16 h-16 object-cover rounded shrink-0" /> : <div className="w-16 h-16 rounded bg-stone-100 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">🛠️ בביצוע</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600">{TYPE_HE[j.job_type] || j.job_type}</span>
                  </div>
                  <div className="text-sm font-medium text-stone-900">{j.title || 'ללא כותרת'}</div>
                  <div className="text-xs text-stone-500">{[j.city, j.customer, 'נפתח ' + d(j.created_at), (j.media || []).length + ' תמונות'].filter(Boolean).join(' · ')}</div>
                  {story && <div className="text-xs text-stone-700 mt-1">{story}</div>}
                </div>
              </div>
              <SketchCracker sketches={j.sketches || []} title="📐 שרטוטים" subject={j.title || ''} />
            </div>
          );
        })}
      </div>
    </details>
  );
}
