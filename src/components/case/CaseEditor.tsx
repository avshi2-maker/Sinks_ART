'use client';
// src/components/case/CaseEditor.tsx · updated 23.09.2026 13:07 (Asia/Jerusalem)
// Case-study cockpit: facts ← | → generate (Claude) · edit · 10 gates · approve & publish.
// Built-ins per house rule: ApiCostMeter (live tokens + cost) + ExportFooter (5 buttons).

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CaseStudy, CaseGen } from '@/lib/case/caseTypes';
import { publishedImages, SITE_URL, STATUS_HE } from '@/lib/case/caseTypes';
import { runGates, allPass } from '@/lib/case/gates';
import { saveGen, publishCase, setCaseStatus, linkCustomer } from '@/lib/case/caseMutations';
import { makeIdleReading, makeRunningReading, makeDoneReading, makeErrorReading } from '@/lib/sinc/apiMeter';
import type { ApiMeterReading } from '@/lib/sinc/types';
import ApiCostMeter from '@/components/shared/ApiCostMeter';
import ExportFooter from '@/components/shared/ExportFooter';
import type { ReportSnapshot } from '@/lib/shared/exportFormats';
import CaseFacts from './CaseFacts';
import GenFields from './GenFields';
import GatesPanel from './GatesPanel';
import AddPhotos from './AddPhotos';

interface Props { c: CaseStudy; customers: { id: string; name_he: string }[]; slugTaken: boolean }

const gold = 'text-sm px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50';
const green = 'text-sm px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed';
const plain = 'text-sm px-3 py-2 rounded-md border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50';

export default function CaseEditor({ c, customers, slugTaken }: Props) {
  const router = useRouter();
  const [gen, setGen] = useState<CaseGen>(c.gen || {});
  const [transcript, setTranscript] = useState(c.transcript || '');
  const [meter, setMeter] = useState<ApiMeterReading>(makeIdleReading());
  const [busy, setBusy] = useState<'' | 'gen' | 'tr'>('');
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const imgs = publishedImages(c);
  const isPub = c.status === 'published';
  const hasGen = !!(gen.title || gen.summary);
  const gates = useMemo(() => runGates(c, gen, slugTaken && gen.slug === c.slug), [c, gen, slugTaken]);
  const ready = allPass(gates);
  const pubUrl = SITE_URL + '/projects/' + (gen.slug || c.slug || '');

  async function call(path: string, label: string, stage: 'analyzing' | 'transcribing') {
    const run = makeRunningReading(stage, label);
    setMeter(run);
    const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: c.id }) });
    const j = await res.json();
    if (!j.ok) { setMeter(makeErrorReading(run, j.error || 'שגיאה')); setMsg('⚠️ ' + (j.error || 'שגיאה')); return null; }
    setMeter(makeDoneReading(run, j.inputTokens || 0, j.outputTokens || 0, j.costUsd || 0));
    return j;
  }

  async function generate() {
    setBusy('gen'); setMsg('');
    const j = await call('/api/case-generate', 'Claude · כתיבת תיק פרויקט', 'analyzing');
    if (j) { setGen(j.gen); setMsg('✓ נוצר · עבור על הטקסט ועל הבדיקות לפני פרסום'); router.refresh(); }
    setBusy('');
  }

  async function transcribe() {
    setBusy('tr'); setMsg('');
    const j = await call('/api/case-transcribe', 'ElevenLabs · תמלול שיחה', 'transcribing');
    if (j) { setTranscript(j.transcript); setMsg('✓ תומלל · לחץ ✨ צור מחדש כדי שהתמלול ייכנס לתיק'); }
    setBusy('');
  }

  function save() { start(async () => { const r = await saveGen(c.id, gen); setMsg(r.ok ? '✓ נשמר' : '⚠️ ' + r.error); router.refresh(); }); }
  function publish() { start(async () => { const r = await publishCase(c.id, gen); setMsg(r.ok ? '✓ פורסם · ' + r.url + ' · ' + r.ping : '⚠️ ' + r.error); router.refresh(); }); }
  function status(s: 'generated' | 'archived') { start(async () => { const r = await setCaseStatus(c.id, s); setMsg(r.ok ? '✓ עודכן' : '⚠️ ' + r.error); router.refresh(); }); }
  function link(v: string) { start(async () => { await linkCustomer(c.id, v || null); router.refresh(); }); }

  const snapshot: ReportSnapshot = {
    reportTypeHe: 'תיק פרויקט',
    subjectSuffix: gen.title || c.title_raw || '',
    projectContext: c.city || undefined,
    sections: [
      { headingHe: '📌 תקציר', bodyHe: gen.summary },
      { headingHe: '🧩 האתגר', bodyHe: gen.challenge },
      { headingHe: '🛠️ התהליך', bodyHe: gen.process },
      { headingHe: '✨ התוצאה', bodyHe: gen.result },
      { headingHe: '❓ שאלות נפוצות', bodyHe: (gen.faq || []).map((f) => f.q + '\n' + f.a).join('\n\n') },
      { headingHe: '📣 אינסטגרם', bodyHe: (gen.social?.ig || '').replace('{URL}', pubUrl) },
    ],
    primaryAssetUrl: isPub ? pubUrl : undefined,
    primaryAssetLabelHe: 'עמוד הפרויקט',
    apiCostUsd: Number(c.gen_cost || 0) + Number(c.transcript_cost || 0),
  };

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
      <CaseFacts c={{ ...c, transcript }} transcript={transcript} busy={busy === 'tr'} onTranscribe={transcribe} />

      <div className="flex flex-col gap-3">
        <div className="bg-white border border-stone-200 rounded-lg p-3 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-xs text-stone-600 flex flex-wrap gap-2 items-center">סטטוס: <b>{STATUS_HE[c.status]}</b>
            {hasGen && <a href={'https://studio.marble-art.co.il/cases#' + c.id} target="_blank" rel="noreferrer" className="px-2 py-0.5 rounded bg-violet-600 text-white no-underline">📣 פתח בסטודיו</a>}
            {['ig', 'fb', 'pin'].map((n) => <span key={n} className={'px-1.5 py-0.5 rounded ' + (c.social_log?.[n] ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500')}>{c.social_log?.[n] ? '✓ ' : ''}{n.toUpperCase()}</span>)}{isPub && <> · <a href={pubUrl} target="_blank" rel="noreferrer" className="text-emerald-700" dir="ltr">{pubUrl.replace('https://', '')}</a></>}</div>
          <select className="text-xs border border-stone-300 rounded px-2 py-1" value={c.customer_id || ''} onChange={(e) => link(e.target.value)}>
            <option value="">— קשר ללקוח ב-CRM —</option>
            {customers.map((u) => <option key={u.id} value={u.id}>{u.name_he}</option>)}
          </select>
        </div>

        <ApiCostMeter mode="single" status={meter} />

        <div className="flex flex-wrap gap-2">
          <button type="button" className={gold} disabled={!!busy} onClick={generate}>{busy === 'gen' ? 'כותב…' : hasGen ? '✨ צור מחדש' : '✨ צור תיק פרויקט'}</button>
          {hasGen && <button type="button" className={plain} disabled={pending} onClick={save}>💾 שמור עריכות</button>}
          {hasGen && <button type="button" className={green} disabled={!ready || pending} onClick={publish}>{isPub ? '✅ עדכן עמוד מפורסם' : '✅ אשר ופרסם'}</button>}
          {isPub && <button type="button" className={plain} disabled={pending} onClick={() => status('generated')}>⏸️ הורד מהאתר</button>}
          {!isPub && c.status !== 'archived' && <button type="button" className={plain} disabled={pending} onClick={() => status('archived')}>🗄️ ארכיון</button>}
        </div>
        <AddPhotos id={c.id} />
        {msg && <div className="text-sm bg-stone-50 border border-stone-200 rounded-md p-2 break-words">{msg}</div>}

        {hasGen ? (
          <>
            <GatesPanel gates={gates} />
            <GenFields gen={gen} setGen={setGen} imageUrls={imgs.map((m) => m.url)} slugLocked={isPub} />
            <ExportFooter snapshot={snapshot} />
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-stone-700">לחץ ✨ צור תיק פרויקט — Claude יכתוב כותרת, סיפור, שאלות נפוצות, ALT ותוכן לרשתות, רק מהעובדות שאלס תיעד. {c.voice?.url && !transcript ? 'מומלץ לתמלל קודם את ההקלטה 🎙️.' : ''}</div>
        )}
      </div>
    </div>
  );
}
