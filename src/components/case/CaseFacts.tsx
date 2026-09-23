'use client';
// src/components/case/CaseFacts.tsx · updated 23.09.2026 11:18 (Asia/Jerusalem)
// Left panel: what Ales captured (read-only facts) + customer recording + 🎙️ transcribe.

import type { CaseStudy } from '@/lib/case/caseTypes';
import { TYPE_HE, mp3Url } from '@/lib/case/caseTypes';

const pill = 'text-[11px] font-semibold px-2 py-0.5 rounded';
const box = 'bg-white border border-stone-200 rounded-lg p-3 flex flex-col gap-2';
const tBtn = 'text-xs px-3 py-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 self-start';

interface Props { c: CaseStudy; transcript: string; busy: boolean; onTranscribe: () => void }

export default function CaseFacts({ c, transcript, busy, onTranscribe }: Props) {
  const f = c.fields || {};
  const facts = Object.entries(f).filter(([, v]) => typeof v === 'string' || typeof v === 'number');
  const cons = c.consent || {};
  return (
    <div className="flex flex-col gap-3">
      <div className={box}>
        <div className="text-sm font-semibold text-stone-800">🧾 מה אלס תיעד · {TYPE_HE[c.job_type || ''] || c.job_type}</div>
        <div className="text-sm text-stone-900">{c.title_raw || '—'}</div>
        <div className="text-xs text-stone-500">{[c.city, c.customer_name + ' (פנימי)', c.finish_date].filter(Boolean).join(' · ')}</div>
        {facts.length > 0 && <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">{facts.flatMap(([k, v]) => [<dt key={k + 'k'} className="text-stone-500">{k}</dt>, <dd key={k + 'v'} className="text-stone-800">{String(v)}</dd>])}</dl>}
        {c.notes && <div className="text-xs text-stone-700 bg-stone-50 rounded p-2">{c.notes}</div>}
        <div className="flex flex-wrap gap-1">
          <span className={pill + ' ' + (cons.photos ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')}>{cons.photos ? '✓' : '✗'} תמונות</span>
          <span className={pill + ' ' + (cons.name_city ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')}>{cons.name_city ? '✓' : '✗'} שם פרטי + עיר</span>
          <span className={pill + ' ' + (cons.quote ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')}>{cons.quote ? '✓' : '✗'} ציטוט</span>
        </div>
      </div>

      <div className={box}>
        <div className="text-sm font-semibold text-stone-800">📸 תמונות ({(c.after_media || []).length} אחרי · {(c.before_media || []).length} לפני)</div>
        <div className="grid grid-cols-4 gap-1">
          {[...(c.after_media || []), ...(c.before_media || [])].map((m, i) => (
            m.type === 'video'
              ? <video key={i} src={m.url} className="w-full aspect-square object-cover rounded" muted playsInline controls />
              : <a key={i} href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt="" className="w-full aspect-square object-cover rounded" /></a>
          ))}
        </div>
      </div>

      <div className={box}>
        <div className="text-sm font-semibold text-stone-800">⭐ המלצה {c.rating ? '· ' + '★'.repeat(c.rating) : ''}</div>
        {c.quote ? <blockquote className="text-sm text-stone-800 bg-amber-50 rounded p-2">&quot;{c.quote}&quot;{c.first_name ? ' — ' + c.first_name : ''}</blockquote> : <div className="text-xs text-stone-500">אין ציטוט כתוב</div>}
        {c.voice?.url ? (
          <>
            <audio src={mp3Url(c.voice.url)} controls preload="metadata" className="w-full" />
            <a href={c.voice.url} target="_blank" rel="noreferrer" className="text-[11px] text-stone-500 underline">קובץ מקורי</a>
            <button type="button" className={tBtn} disabled={busy} onClick={onTranscribe}>{busy ? 'מתמלל…' : transcript ? '🎙️ תמלל מחדש' : '🎙️ תמלל הקלטה (ElevenLabs)'}</button>
            {transcript && <pre className="text-xs whitespace-pre-wrap bg-violet-50 rounded p-2 max-h-56 overflow-auto">{transcript}</pre>}
          </>
        ) : <div className="text-xs text-stone-500">אין הקלטה</div>}
      </div>
    </div>
  );
}
