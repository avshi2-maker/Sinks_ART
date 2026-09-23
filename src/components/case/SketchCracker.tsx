'use client';
// src/components/case/SketchCracker.tsx · updated 23.09.2026 16:51 (Asia/Jerusalem)
// 📐 Read Ales's sketch photo with Claude vision (existing /api/analyze-photo, mediaType 'sketch')
// → work-instruction draft (dimensions, shape, mount, drain, tap hole, notes). Meter + 5-button export.
// When caseId is given, the reading is saved on the case (sketch_analysis).

import { useState } from 'react';
import ApiCostMeter from '@/components/shared/ApiCostMeter';
import ExportFooter from '@/components/shared/ExportFooter';
import { makeIdleReading, makeRunningReading, makeDoneReading, makeErrorReading } from '@/lib/sinc/apiMeter';
import type { ApiMeterReading } from '@/lib/sinc/types';
import type { ReportSnapshot } from '@/lib/shared/exportFormats';
import { saveSketchAnalysis } from '@/lib/case/caseMutations';

export interface SketchReading { url: string; at: string; dims: string; shape: string; mount: string; drain: string; tap_hole: string; notes: string; intent: string; cost: number }

const MOUNT: Record<string, string> = { wall: 'תלוי קיר', countertop: 'על משטח' };
const DRAIN: Record<string, string> = { round: 'ניקוז עגול', linear: 'תעלת ניקוז ליניארית' };
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

interface Props { sketches: { url: string }[]; caseId?: string; initial?: SketchReading[]; title?: string; subject?: string }

export default function SketchCracker({ sketches, caseId, initial = [], title = '📐 שרטוטים מאלס', subject = '' }: Props) {
  const [readings, setReadings] = useState<SketchReading[]>(initial);
  const [meter, setMeter] = useState<ApiMeterReading>(makeIdleReading());
  const [busy, setBusy] = useState('');
  if (!sketches.length) return null;

  async function crack(url: string) {
    setBusy(url);
    const run = makeRunningReading('analyzing', 'Claude · פענוח שרטוט');
    setMeter(run);
    try {
      const res = await fetch('/api/analyze-photo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ imageUrl: url, mediaType: 'sketch' }) });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || 'שגיאה בניתוח');
      const p = (d.parsed || {}) as Record<string, unknown>;
      const r: SketchReading = {
        url, at: new Date().toISOString(),
        dims: s(p.extracted_dimensions), shape: s(p.extracted_shape),
        mount: MOUNT[s(p.detected_mount)] || s(p.detected_mount), drain: DRAIN[s(p.detected_drain)] || s(p.detected_drain),
        tap_hole: p.detected_tap_hole === true ? 'כן' : p.detected_tap_hole === false ? 'לא' : '',
        notes: s(p.additional_notes_he), intent: s(p.design_intent_he), cost: Number(d.apiCostUsd || 0),
      };
      const next = [...readings.filter((x) => x.url !== url), r];
      setReadings(next);
      setMeter(makeDoneReading(run, Number(d.inputTokens || 0), Number(d.outputTokens || 0), r.cost));
      if (caseId) await saveSketchAnalysis(caseId, next);
    } catch (e) {
      setMeter(makeErrorReading(run, (e as Error).message));
    }
    setBusy('');
  }

  const instruction = (r: SketchReading) => [
    r.dims && 'מידות: ' + r.dims, r.shape && 'צורה: ' + r.shape, r.mount && 'התקנה: ' + r.mount,
    r.drain && 'ניקוז: ' + r.drain, r.tap_hole && 'חור לברז: ' + r.tap_hole, r.intent && 'כוונה: ' + r.intent, r.notes && 'הערות: ' + r.notes,
  ].filter(Boolean).join('\n');

  const snapshot: ReportSnapshot = {
    reportTypeHe: 'הוראת עבודה משרטוט',
    subjectSuffix: subject,
    sections: readings.map((r, i) => ({ headingHe: '📐 שרטוט ' + (i + 1), bodyHe: instruction(r) })),
    primaryAssetUrl: readings[0]?.url || sketches[0].url,
    primaryAssetLabelHe: 'תמונת השרטוט',
    apiCostUsd: readings.reduce((a, r) => a + r.cost, 0),
  };

  const btn = 'text-xs px-3 py-1.5 rounded-md bg-sky-700 text-white hover:bg-sky-800 disabled:opacity-50';
  return (
    <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex flex-col gap-2">
      <div className="text-sm font-semibold text-sky-900">{title} ({sketches.length})</div>
      {meter.stage !== 'idle' && <ApiCostMeter mode="single" status={meter} />}
      {sketches.map((sk) => {
        const r = readings.find((x) => x.url === sk.url);
        return (
          <div key={sk.url} className="flex gap-2 items-start bg-white rounded-md p-2 border border-sky-100">
            <a href={sk.url} target="_blank" rel="noreferrer" className="shrink-0"><img src={sk.url} alt="שרטוט" className="w-24 h-24 object-cover rounded" /></a>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <button type="button" className={btn + ' self-start'} disabled={!!busy} onClick={() => crack(sk.url)}>{busy === sk.url ? 'מפענח…' : r ? '🔄 פענח מחדש' : '📐 פענח שרטוט → הוראת עבודה'}</button>
              {r && <pre className="text-xs whitespace-pre-wrap text-stone-800 bg-sky-50 rounded p-2">{instruction(r) || 'לא זוהו נתונים — צלם שוב ברור יותר'}</pre>}
            </div>
          </div>
        );
      })}
      {readings.length > 0 && <ExportFooter snapshot={snapshot} />}
    </div>
  );
}
