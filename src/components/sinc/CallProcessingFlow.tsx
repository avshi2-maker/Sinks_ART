/**
 * src/components/sinc/CallProcessingFlow.tsx
 *
 * Orchestrates the full SinC-ART pipeline:
 *   1. Audio file selected (from AudioFilePicker)
 *   2. Upload to Cloudinary (with progress)
 *   3. Transcribe via /api/sinc-transcribe
 *   4. Analyze via /api/sinc-analyze
 *   5. Display editable speaker bubbles + Hebrew analysis fields
 *   6. ExportFooter + ApiCostMeter integrated per Rule #11
 *   7. PHASE D: SaveCustomerModal -> saveCallFull -> success state
 *   8. PHASE 16.5: post-save customer page navigation
 *      - "👤 פתח עמוד לקוח" indigo button next to ✓ נשמר! success message
 *      - ExportFooter "פרויקט" button wired via onProjectClick prop
 *      Both open /customers/[customer_id] in a new tab so SinC review state
 *      is preserved (user can do another save without re-uploading).
 *
 * Speaker rename model: a single `speakerMap` (originalLabel -> displayName) is
 * the only source of truth for speaker names. Editing one row in the
 * SpeakerNamePanel propagates to EVERY bubble with that original label, AND
 * to the exported transcript AND to the saved transcript body.
 *
 * Phase B/C  - Audio pipeline             (Session 17, 06/05/2026)
 * Phase D    - Save flow                  (Session 18, 06/05/2026)
 * Phase 16.5 - Customer page navigation   (Session 19, 07/05/2026)
 */

'use client';

import { useState } from 'react';
import { uploadAudioToCloudinary } from '@/lib/sinc/cloudinaryAudio';
import {
  makeRunningReading,
  makeDoneReading,
  makeErrorReading,
  calcElevenLabsCost,
} from '@/lib/sinc/apiMeter';
import { saveCallFull, buildCallSubject } from '@/lib/sinc/supabaseSinc';
import ApiCostMeter from '@/components/shared/ApiCostMeter';
import ExportFooter from '@/components/shared/ExportFooter';
import SaveCustomerModal from '@/components/sinc/SaveCustomerModal';
import { createPastedLead } from '@/lib/leads/leadsData';
import type {
  ApiMeterReading,
  CallAnalysis,
  TranscriptionResult,
  SpeakerBubble,
  SincCallSaveResult,
} from '@/lib/sinc/types';
import type { ReportSnapshot } from '@/lib/shared/exportFormats';

interface Props {
  file:        File;
  durationSec: number;
  onCancel:    () => void;
}

type Stage     = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'review' | 'error';
type SaveState = 'idle' | 'modal_open' | 'saving' | 'saved' | 'save_error';

export default function CallProcessingFlow({ file, durationSec, onCancel }: Props) {
  const [stage, setStage]                 = useState<Stage>('idle');
  const [error, setError]                 = useState<string>('');
  const [uploadPct, setUploadPct]         = useState<number>(0);

  const [meterStages, setMeterStages]     = useState<ApiMeterReading[]>([]);

  const [audioUrl, setAudioUrl]           = useState<string>('');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [analysis, setAnalysis]           = useState<CallAnalysis | null>(null);
  const [analysisRaw, setAnalysisRaw]     = useState<Record<string, unknown> | null>(null);
  const [transcribeCost, setTranscribeCost] = useState<number>(0);
  const [analyzeCost, setAnalyzeCost]     = useState<number>(0);

  const [bubbles, setBubbles]             = useState<SpeakerBubble[]>([]);
  const [speakerMap, setSpeakerMap]       = useState<Record<string, string>>({});

  // Phase D: save state
  const [saveState, setSaveState]         = useState<SaveState>('idle');
  const [saveError, setSaveError]         = useState<string>('');
  const [saveResult, setSaveResult]       = useState<SincCallSaveResult | null>(null);

  // ── Helpers: meter ──
  function pushStage(reading: ApiMeterReading) {
    setMeterStages((prev) => [...prev, reading]);
  }

  function updateLastStage(updater: (last: ApiMeterReading) => ApiMeterReading) {
    setMeterStages((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      next.push(updater(prev[prev.length - 1]));
      return next;
    });
  }

  // ── Helpers: speaker map ──

  function initSpeakerMap(loadedBubbles: SpeakerBubble[]) {
    const seen: Record<string, string> = {};
    loadedBubbles.forEach((b) => {
      if (!(b.speaker_label in seen)) {
        seen[b.speaker_label] = b.speaker_label;
      }
    });
    setSpeakerMap(seen);
  }

  function setSpeakerName(originalLabel: string, newName: string) {
    setSpeakerMap((prev) => ({ ...prev, [originalLabel]: newName }));
  }

  function displayName(originalLabel: string): string {
    const mapped = speakerMap[originalLabel];
    return mapped && mapped.trim() ? mapped : originalLabel;
  }

  // ── The full pipeline ──

  async function startPipeline() {
    setError('');
    setMeterStages([]);

    setStage('uploading');
    const uploadStage = makeRunningReading('uploading', 'העלאה ל-Cloudinary');
    pushStage(uploadStage);

    let uploadedUrl: string;
    try {
      const res = await uploadAudioToCloudinary(file, (pct) => setUploadPct(pct));
      uploadedUrl = res.url;
      setAudioUrl(uploadedUrl);
      updateLastStage((s) => makeDoneReading(s, 0, 0, 0));
    } catch (e) {
      const msg = 'שגיאת העלאה: ' + (e instanceof Error ? e.message : String(e));
      updateLastStage((s) => makeErrorReading(s, msg));
      setStage('error');
      setError(msg);
      return;
    }

    setStage('transcribing');
    const transcribeStage = makeRunningReading('transcribing', 'תמלול ElevenLabs');
    pushStage(transcribeStage);

    let transcript: TranscriptionResult;
    let trCost = 0;
    try {
      const res = await fetch('/api/sinc-transcribe', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ audioUrl: uploadedUrl, durationSec }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאת תמלול לא ידועה');
      }
      transcript = data.transcription as TranscriptionResult;
      trCost     = Number(data.costUsd) || calcElevenLabsCost(durationSec);
      setTranscription(transcript);
      setBubbles(transcript.bubbles);
      initSpeakerMap(transcript.bubbles);
      setTranscribeCost(trCost);
      updateLastStage((s) => makeDoneReading(s, 0, 0, trCost));
    } catch (e) {
      const msg = 'שגיאת תמלול: ' + (e instanceof Error ? e.message : String(e));
      updateLastStage((s) => makeErrorReading(s, msg));
      setStage('error');
      setError(msg);
      return;
    }

    setStage('analyzing');
    const analyzeStage = makeRunningReading('analyzing', 'ניתוח Claude');
    pushStage(analyzeStage);

    try {
      const res = await fetch('/api/sinc-analyze', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          transcriptText: transcript.rawText,
          durationSec:    transcript.durationSec,
          filename:       file.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאת ניתוח לא ידועה');
      }
      const analysisData = data.analysis as CallAnalysis;
      setAnalysis(analysisData);
      setAnalysisRaw(data.rawJson || null);
      const cost = Number(data.apiCostUsd) || 0;
      setAnalyzeCost(cost);
      updateLastStage((s) => makeDoneReading(s, Number(data.inputTokens) || 0, Number(data.outputTokens) || 0, cost));
      setStage('review');
    } catch (e) {
      const msg = 'שגיאת ניתוח: ' + (e instanceof Error ? e.message : String(e));
      updateLastStage((s) => makeErrorReading(s, msg));
      setStage('error');
      setError(msg);
    }
  }

  const [leadSaved, setLeadSaved] = useState(false);
  async function createLeadFromCall() {
    if (!analysis) return;
    const notes = [analysis.project_type, analysis.desired_style, analysis.budget_signal, analysis.dimensions, analysis.summary_he].filter(Boolean).join(' · ');
    const res = await createPastedLead({
      full_name: analysis.customer_name_he || undefined,
      phone: analysis.customer_phone || undefined,
      city_he: analysis.customer_location || undefined,
      style_he: analysis.desired_style || undefined,
      notes_he: notes || undefined,
      source: 'call',
    });
    if (res.ok) setLeadSaved(true);
    else window.alert('יצירת ליד נכשלה: ' + (res.error || ''));
  }

  // ── Build snapshot for ExportFooter ──

  function buildTranscriptText(): string {
    return bubbles
      .map((b) => `${displayName(b.speaker_label)}: ${b.text}`)
      .join('\n');
  }

  function buildSnapshot(): ReportSnapshot {
    if (!analysis) {
      return { reportTypeHe: 'שיחה עם לקוח', subjectSuffix: file.name, sections: [] };
    }
    const totalCost      = transcribeCost + analyzeCost;
    const transcriptText = buildTranscriptText();

    return {
      reportTypeHe:   'שיחה עם לקוח',
      subjectSuffix:  file.name,
      sections: [
        { headingHe: '📋 סיכום',          bodyHe: analysis.summary_he },
        { headingHe: '👤 לקוח',            bodyHe: [analysis.customer_name_he, analysis.customer_phone, analysis.customer_location].filter(Boolean).join(' · ') },
        { headingHe: '🏗️ פרויקט',          bodyHe: [analysis.project_type, analysis.desired_style, analysis.budget_signal].filter(Boolean).join(' · ') },
        { headingHe: '📐 פרטים טכניים',    bodyHe: [analysis.dimensions, analysis.stone_preference, analysis.faucet_setup, analysis.delivery_timeline].filter(Boolean).join(' · ') },
        { headingHe: '✅ משימות',          bodyHe: analysis.action_items_he.join('\n') },
        { headingHe: '❓ שאלות פתוחות',    bodyHe: analysis.open_questions_he.join('\n') },
        { headingHe: '⚠️ סימני אזהרה',    bodyHe: analysis.red_flags_he.join('\n') },
        { headingHe: '💡 הערות',           bodyHe: analysis.notes_he },
        { headingHe: '🎙️ תמלול מלא',      bodyHe: transcriptText },
      ],
      primaryAssetUrl:     audioUrl,
      primaryAssetLabelHe: 'הקלטה',
      apiCostUsd:          totalCost,
    };
  }

  // ── Phase D: save flow ──

  function openSaveModal() {
    if (!analysis) return;
    setSaveError('');
    setSaveState('modal_open');
  }

  async function handleModalConfirm(sel: { customer_id: string; project_id: string | null }) {
    if (!analysis) return;
    setSaveState('saving');
    setSaveError('');

    try {
      const totalCost      = transcribeCost + analyzeCost;
      const transcriptText = buildTranscriptText();

      const result = await saveCallFull({
        customer_id:         sel.customer_id,
        project_id:          sel.project_id,
        subject:             buildCallSubject(analysis),
        body:                transcriptText,
        ai_analysis:         analysis,
        audio_url:           audioUrl,
        api_cost_usd:        totalCost,
        source_filename:     file.name,
        speaker_map:         speakerMap,
        bubbles:             bubbles,
        raw_transcript_text: transcription?.rawText || transcriptText,
        duration_sec:        transcription?.durationSec || durationSec,
      });

      setSaveResult(result);
      setSaveState('saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSaveError(msg);
      setSaveState('save_error');
    }
  }

  function handleModalCancel() {
    setSaveState('idle');
  }

  function handleSaveErrorRetry() {
    setSaveState('modal_open');
    setSaveError('');
  }

  // ── Phase 16.5: post-save customer page navigation ──
  // Returns a click handler ONLY when a save has succeeded — before save the
  // ExportFooter "פרויקט" button keeps its existing "יבוא בעדכון הבא" alert.
  // Opens in a new tab so the SinC review state is preserved (user can keep
  // working on the same call analysis without re-uploading the audio file).
  function exportFooterProjectClick(): (() => void) | undefined {
    if (saveState === 'saved' && saveResult) {
      return () => window.open('/customers/' + saveResult.customer_id, '_blank');
    }
    return undefined;
  }

  // ── Render ──

  const speakerOriginals = Object.keys(speakerMap);

  return (
    <div className="call-processing-flow space-y-4" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          {stage === 'idle' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium">קובץ מוכן: {file.name}</div>
              <div className="flex gap-2">
                <button type="button" onClick={startPipeline} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  <span>🪄 התחל עיבוד</span>
                </button>
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
                  <span>ביטול</span>
                </button>
              </div>
            </div>
          )}

          {stage === 'uploading' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="text-sm">⬆️ מעלה ל-Cloudinary... {uploadPct}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full transition-all" style={{ width: uploadPct + '%' }} />
              </div>
            </div>
          )}

          {stage === 'transcribing' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
              🎙️ מתמלל את השיחה... (יכול לקחת 30-60 שניות לשיחות ארוכות)
            </div>
          )}

          {stage === 'analyzing' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
              🔍 Claude מנתח את התמלול... (5-15 שניות)
            </div>
          )}

          {stage === 'error' && (
            <div className="space-y-2">
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">⚠️ {error}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStage('idle')} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  <span>נסה שוב</span>
                </button>
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
                  <span>ביטול</span>
                </button>
              </div>
            </div>
          )}

          {stage === 'review' && analysis && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  ✓ הניתוח הושלם · עלות כוללת: ${(transcribeCost + analyzeCost).toFixed(4)}
                </div>

                <Section heading="📋 סיכום"               body={analysis.summary_he} />
                <Section heading="👤 לקוח"                 body={[analysis.customer_name_he, analysis.customer_phone, analysis.customer_location].filter(Boolean).join(' · ')} />
                <Section heading="🏗️ סוג הפרויקט"          body={analysis.project_type} />
                <Section heading="🎨 סגנון רצוי"           body={analysis.desired_style} />
                <Section heading="💰 אינדיקציית תקציב"      body={analysis.budget_signal} />
                <Section heading="📐 מידות"                body={analysis.dimensions} />
                <Section heading="🪨 העדפת אבן"            body={analysis.stone_preference} />
                <Section heading="🚿 הגדרת ברז"            body={analysis.faucet_setup} />
                <Section heading="📅 לוח זמנים"            body={analysis.delivery_timeline} />
                <SectionList heading="✅ משימות"           items={analysis.action_items_he} />
                <SectionList heading="❓ שאלות פתוחות"      items={analysis.open_questions_he} />
                <SectionList heading="⚠️ סימני אזהרה"      items={analysis.red_flags_he} />
                <Section heading="💡 הערות נוספות"         body={analysis.notes_he} />
              </div>

              {speakerOriginals.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-amber-900">
                    <span>👥 שמות הדוברים</span>
                  </div>
                  <div className="text-xs text-amber-800">
                    <span>ערוך פעם אחת — יתעדכן בכל ההודעות בתמלול ובייצוא</span>
                  </div>
                  <div className="space-y-2 pt-2">
                    {speakerOriginals.map((origLabel) => (
                      <div key={origLabel} className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 min-w-[70px]">{origLabel}:</span>
                        <input
                          type="text"
                          value={speakerMap[origLabel]}
                          onChange={(e) => setSpeakerName(origLabel, e.target.value)}
                          placeholder={origLabel}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:border-amber-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bubbles.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-gray-900">
                    <span>🎙️ תמלול לפי דוברים:</span>
                  </div>
                  <div className="space-y-2">
                    {bubbles.map((b, i) => (
                      <div key={i} className="border border-gray-200 rounded p-2 text-sm">
                        <div className="font-medium text-blue-700">
                          {displayName(b.speaker_label)}
                        </div>
                        <div className="text-gray-700 mt-1 whitespace-pre-wrap">{b.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ExportFooter
                snapshot={buildSnapshot()}
                onProjectClick={exportFooterProjectClick()}
              />

              {/* Phase D — Save action area */}
              <div className="flex gap-2 pt-2 items-center flex-wrap">
                {saveState === 'idle' && (
                  <>
                    <button
                      type="button"
                      onClick={openSaveModal}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      <span>✓ אשר ושמור</span>
                    </button>
                    <button type="button" onClick={createLeadFromCall} disabled={leadSaved} className="px-4 py-2 bg-pink-600 text-white rounded-md text-sm hover:bg-pink-700 disabled:opacity-50">
            <span>{leadSaved ? '✓ ליד נוצר' : '📥 צור ליד'}</span>
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
                      <span>ביטול</span>
                    </button>
                  </>
                )}

                {saveState === 'saving' && (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm opacity-70 cursor-wait"
                  >
                    <span>💾 שומר...</span>
                  </button>
                )}

                {saveState === 'saved' && saveResult && (
                  <div className="flex gap-2 items-center flex-wrap">
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                      <span>
                        ✓ נשמר! מספר שיחה: {saveResult.comm_id.substring(0, 8)}...
                        {saveResult.project_was_new ? ' · פרויקט חדש נוצר' : ''}
                      </span>
                    </div>
                    {/* Phase 16.5 — primary follow-through after save */}
                    <a
                      href={'/customers/' + saveResult.customer_id}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 no-underline"
                    >
                      <span>👤 פתח עמוד לקוח</span>
                    </a>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      <span>שיחה חדשה</span>
                    </button>
                  </div>
                )}

                {saveState === 'save_error' && (
                  <div className="space-y-2 w-full">
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                      <span>⚠️ שגיאת שמירה: {saveError}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveErrorRetry}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        <span>נסה שוב</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSaveState('idle')}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      >
                        <span>ביטול</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside>
          <ApiCostMeter mode="pipeline" stages={meterStages} />
        </aside>
      </div>

      {/* Phase D — Customer/project picker modal */}
      {saveState === 'modal_open' && analysis && (
        <SaveCustomerModal
          suggestedName={analysis.customer_name_he}
          suggestedPhone={analysis.customer_phone}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
}

// ── Small render helpers ──

function Section({ heading, body }: { heading: string; body: string }) {
  if (!body || !body.trim()) return null;
  return (
    <div>
      <div className="text-xs font-medium text-gray-700 mb-1">{heading}</div>
      <div className="text-sm text-gray-900 whitespace-pre-wrap">{body}</div>
    </div>
  );
}

function SectionList({ heading, items }: { heading: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-medium text-gray-700 mb-1">{heading}</div>
      <ul className="text-sm text-gray-900 list-disc pr-5 space-y-1">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
