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
 *
 * Speaker rename model (Session 17 fix):
 *   A single `speakerMap` (originalLabel -> displayName) is the only source of
 *   truth for speaker names. Editing one row in the SpeakerNamePanel
 *   propagates to EVERY bubble with that original label, AND to the exported
 *   transcript. Bubbles themselves stay immutable as received from ElevenLabs.
 *
 * Phase B/C - Audio pipeline (Session 17, 06/05/2026)
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
import ApiCostMeter from '@/components/shared/ApiCostMeter';
import ExportFooter from '@/components/shared/ExportFooter';
import type {
  ApiMeterReading,
  CallAnalysis,
  TranscriptionResult,
  SpeakerBubble,
} from '@/lib/sinc/types';
import type { ReportSnapshot } from '@/lib/shared/exportFormats';

interface Props {
  file:        File;
  durationSec: number;
  onCancel:    () => void;
}

type Stage = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'review' | 'error';

export default function CallProcessingFlow({ file, durationSec, onCancel }: Props) {
  const [stage, setStage]                 = useState<Stage>('idle');
  const [error, setError]                 = useState<string>('');
  const [uploadPct, setUploadPct]         = useState<number>(0);

  // Live API meter — array of stages for the pipeline display
  const [meterStages, setMeterStages]     = useState<ApiMeterReading[]>([]);

  // Pipeline outputs
  const [audioUrl, setAudioUrl]           = useState<string>('');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [analysis, setAnalysis]           = useState<CallAnalysis | null>(null);
  const [analysisRaw, setAnalysisRaw]     = useState<Record<string, unknown> | null>(null);
  const [transcribeCost, setTranscribeCost] = useState<number>(0);
  const [analyzeCost, setAnalyzeCost]     = useState<number>(0);

  // Bubbles are stored AS RECEIVED from ElevenLabs (speaker_label is immutable).
  // Display names come from speakerMap below.
  const [bubbles, setBubbles]             = useState<SpeakerBubble[]>([]);

  // Single source of truth for speaker display names.
  //   Key   = original label from ElevenLabs (e.g. "דובר 1")
  //   Value = the name shown to the user (defaults to the key).
  // Editing one entry here updates every bubble + the export at once.
  const [speakerMap, setSpeakerMap]       = useState<Record<string, string>>({});

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

    // Stage 1: Upload to Cloudinary
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

    // Stage 2: Transcribe via ElevenLabs
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

    // Stage 3: Analyze via Claude
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

  // ── Build snapshot for ExportFooter ──

  function buildSnapshot(): ReportSnapshot {
    if (!analysis) {
      return { reportTypeHe: 'שיחה עם לקוח', subjectSuffix: file.name, sections: [] };
    }
    const totalCost = transcribeCost + analyzeCost;

    // Use displayName() so renamed speakers appear in email/WhatsApp/Print exports too.
    const transcriptText = bubbles
      .map((b) => `${displayName(b.speaker_label)}: ${b.text}`)
      .join('\n');

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
              {/* Analysis card */}
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

              {/* Speaker name panel — single source of truth (Session 17 fix) */}
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

              {/* Speaker bubbles — display only; names pulled from speakerMap */}
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

              {/* Export footer (Rule #11) */}
              <ExportFooter snapshot={buildSnapshot()} />

              <div className="flex gap-2 pt-2">
                <button type="button" disabled className="px-4 py-2 bg-green-600 text-white rounded-md text-sm opacity-50 cursor-not-allowed" title="שמירה ללקוח/פרויקט תיווסף בPhase D">
                  <span>✓ אשר ושמור (יבוא בקרוב)</span>
                </button>
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
                  <span>ביטול</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live API meter (sidebar) */}
        <aside>
          <ApiCostMeter mode="pipeline" stages={meterStages} />
        </aside>
      </div>
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
