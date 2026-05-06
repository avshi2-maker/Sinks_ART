/**
 * Mp4Analyzer.tsx
 *
 * Video walk-around analysis flow:
 *   1. Receives an MP4 File from MediaInput
 *   2. Uploads to Cloudinary (folder: marble-sinks/intake) as resource_type='video'
 *   3. Extracts a JPEG frame at second N (default 1) via Cloudinary URL transform
 *   4. Sends that frame to /api/analyze-photo with mediaType='mp4'
 *   5. Displays Hebrew structured analysis with editable fields
 *   6. User can re-extract a different frame and re-analyze
 *   7. Renders <AnalysisActionBar> per Phase 15.5 Rule #11
 *
 * Phase 15 — Multi-Format Media Intake (Session 17)
 * Created: 06/05/2026
 */

'use client';

import { useState } from 'react';
import {
  uploadToCloudinary,
  getVideoFrameUrl,
  isCloudinaryConfigured,
} from '@/lib/intake/cloudinary';
import AnalysisActionBar from '@/components/intake/AnalysisActionBar';
import {
  ApiCallStatusData,
  makeRunningStatus,
  makeDoneStatus,
  makeErrorStatus,
} from '@/components/intake/ApiCallStatus';
import type { CustomerWithProject } from '@/lib/supabase';
import type { AnalysisResult } from '@/components/intake/analyzers/PhotoAnalyzer';

interface Props {
  file:           File;
  customer:       CustomerWithProject | null;
  onComplete:     (result: AnalysisResult) => void;
  onCancel:       () => void;
  onStatusChange: (status: ApiCallStatusData) => void;
}

type Stage = 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'review' | 'error';

interface AnalysisFields {
  extractedDimensions: string;
  extractedStoneType:  string;
  extractedShape:      string;
  designIntentHe:      string;
  referenceSummaryHe:  string;
  additionalNotesHe:   string;
}

const EMPTY_FIELDS: AnalysisFields = {
  extractedDimensions: '',
  extractedStoneType:  '',
  extractedShape:      '',
  designIntentHe:      '',
  referenceSummaryHe:  '',
  additionalNotesHe:   '',
};

export default function Mp4Analyzer({
  file,
  customer,
  onComplete,
  onCancel,
  onStatusChange,
}: Props) {
  const [stage, setStage]               = useState<Stage>('idle');
  const [errorMsg, setErrorMsg]         = useState<string>('');
  const [videoUrl, setVideoUrl]         = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [frameSecond, setFrameSecond]   = useState<number>(1);
  const [frameUrl, setFrameUrl]         = useState<string>('');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [apiCostUsd, setApiCostUsd]     = useState<number>(0);
  const [rawJson, setRawJson]           = useState<Record<string, unknown> | null>(null);
  const [fields, setFields]             = useState<AnalysisFields>(EMPTY_FIELDS);

  async function startAnalysis() {
    setErrorMsg('');

    if (!isCloudinaryConfigured()) {
      setStage('error');
      setErrorMsg('Cloudinary לא מוגדר ב-.env.local');
      return;
    }

    setStage('uploading');
    const runStatus = makeRunningStatus('העלאת סרטון + ניתוח Claude Sonnet 4-6');
    onStatusChange(runStatus);

    let uploaded;
    try {
      uploaded = await uploadToCloudinary(file);
    } catch (e) {
      const msg = 'שגיאת העלאה ל-Cloudinary: ' + (e instanceof Error ? e.message : String(e));
      setStage('error');
      setErrorMsg(msg);
      onStatusChange(makeErrorStatus(runStatus, msg));
      return;
    }

    setVideoUrl(uploaded.url);
    setVideoDuration(uploaded.duration || 0);

    const extractedFrameUrl = getVideoFrameUrl(uploaded.url, 1);
    setFrameUrl(extractedFrameUrl);
    setFrameSecond(1);

    setStage('analyzing');
    await runAnalysis(extractedFrameUrl, runStatus);
  }

  async function reExtractAndAnalyze() {
    if (!videoUrl) return;
    setErrorMsg('');

    const newFrameUrl = getVideoFrameUrl(videoUrl, frameSecond);
    setFrameUrl(newFrameUrl);

    setStage('analyzing');
    const runStatus = makeRunningStatus('ניתוח פריים חדש (שניה ' + frameSecond + ')');
    onStatusChange(runStatus);
    await runAnalysis(newFrameUrl, runStatus);
  }

  async function runAnalysis(targetFrameUrl: string, runStatus: ApiCallStatusData) {
    try {
      const res = await fetch('/api/analyze-photo', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ imageUrl: targetFrameUrl, mediaType: 'mp4' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || 'שגיאה בניתוח הפריים';
        setStage('error');
        setErrorMsg(msg);
        onStatusChange(makeErrorStatus(runStatus, msg));
        return;
      }

      const inputTokens  = Number(data.inputTokens  || 0);
      const outputTokens = Number(data.outputTokens || 0);
      const costUsd      = Number(data.apiCostUsd   || 0);

      setApiCostUsd(costUsd);
      setRawJson(data.parsed || null);

      const parsed = (data.parsed || {}) as Record<string, string | null>;
      setFields({
        extractedDimensions: parsed.extracted_dimensions || '',
        extractedStoneType:  parsed.extracted_stone_type || '',
        extractedShape:      parsed.extracted_shape       || '',
        designIntentHe:      parsed.design_intent_he      || '',
        referenceSummaryHe:  parsed.reference_summary_he  || '',
        additionalNotesHe:   parsed.additional_notes_he   || '',
      });
      setStage('review');
      onStatusChange(makeDoneStatus(runStatus, inputTokens, outputTokens, costUsd));
    } catch (e) {
      const msg = 'שגיאת רשת: ' + (e instanceof Error ? e.message : String(e));
      setStage('error');
      setErrorMsg(msg);
      onStatusChange(makeErrorStatus(runStatus, msg));
    }
  }

  function approve() {
    onComplete(buildResult());
  }

  function buildResult(): AnalysisResult {
    return {
      cloudinaryUrl:       videoUrl,
      sourceFilename:      file.name,
      mediaType:           'mp4',
      extractedDimensions: fields.extractedDimensions || null,
      extractedStoneType:  fields.extractedStoneType  || null,
      extractedShape:      fields.extractedShape      || null,
      designIntentHe:      fields.designIntentHe      || null,
      referenceSummaryHe:  fields.referenceSummaryHe  || null,
      additionalNotesHe:   fields.additionalNotesHe   || null,
      apiCostUsd,
      rawJson,
    };
  }

  function updateField(key: keyof AnalysisFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mp4-analyzer space-y-4" dir="rtl">
      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
        <div className="font-medium text-gray-900">{file.name}</div>
        <div className="text-xs text-gray-500 mt-1">
          {(file.size / (1024 * 1024)).toFixed(2)} מ״ב · סרטון
        </div>
      </div>

      {stage === 'idle' && (
        <div className="flex gap-2">
          <button type="button" onClick={startAnalysis} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            <span>🪄 העלה ונתח</span>
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
            <span>ביטול</span>
          </button>
        </div>
      )}

      {stage === 'uploading' && (
        <div className="text-sm text-gray-600 py-4">
          ⬆️ מעלה סרטון ל-Cloudinary... (יכול לקחת 10-30 שניות לקבצים גדולים)
        </div>
      )}

      {stage === 'analyzing' && (
        <div className="text-sm text-gray-600 py-4">
          🔍 Claude מנתח את הפריים... (5-15 שניות)
        </div>
      )}

      {stage === 'error' && (
        <div className="space-y-2">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">⚠️ {errorMsg}</div>
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

      {stage === 'review' && (
        <div className="space-y-3">
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            ✓ ניתוח הושלם · עלות: ${apiCostUsd.toFixed(4)}
          </div>

          {frameUrl && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                פריים שנותח (שניה {frameSecond}{videoDuration > 0 ? ' מתוך ' + Math.floor(videoDuration) : ''}):
              </div>
              <div className="border border-gray-200 rounded overflow-hidden bg-gray-50 inline-block max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frameUrl} alt="extracted frame" className="block w-full" />
              </div>
            </div>
          )}

          {videoUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
              <div className="text-xs font-medium text-gray-700">לקפוץ לזמן אחר בסרטון:</div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-gray-600">שניה:</label>
                <input
                  type="number"
                  min={0}
                  max={videoDuration > 0 ? Math.floor(videoDuration) : 9999}
                  value={frameSecond}
                  onChange={(e) => setFrameSecond(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={reExtractAndAnalyze}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  title="ישלוף פריים חדש ויעלה עוד $0.018"
                >
                  <span>🔄 שלוף ונתח שוב</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                >
                  <span>{showOriginal ? '🙈 הסתר סרטון' : '▶️ הצג סרטון מקורי'}</span>
                </button>
              </div>
              <div className="text-xs text-gray-500">
                💡 טיפ: לרוב הפריים בשניה הראשונה מספיק. שנה רק אם הפריים מטושטש או לא רלוונטי.
              </div>
            </div>
          )}

          {showOriginal && videoUrl && (
            <div className="border border-gray-200 rounded overflow-hidden bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={videoUrl} controls className="block w-full max-w-md" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="מידות"  value={fields.extractedDimensions} onChange={(v) => updateField('extractedDimensions', v)} placeholder="לדוגמה: 60×40×15 ס״מ" />
            <Field label="סוג אבן" value={fields.extractedStoneType}  onChange={(v) => updateField('extractedStoneType', v)}  placeholder="לדוגמה: קרארה / ורדה אלפי" />
            <Field label="צורה"   value={fields.extractedShape}       onChange={(v) => updateField('extractedShape', v)}       placeholder="אובלי / מלבני / חופשי" />
          </div>

          <TextArea label="כוונת העיצוב"      value={fields.designIntentHe}     onChange={(v) => updateField('designIntentHe', v)}     rows={2} />
          <TextArea label="תיאור החומר המצורף" value={fields.referenceSummaryHe} onChange={(v) => updateField('referenceSummaryHe', v)} rows={2} />
          <TextArea label="הערות נוספות"      value={fields.additionalNotesHe}  onChange={(v) => updateField('additionalNotesHe', v)}  rows={2} />

          <AnalysisActionBar result={buildResult()} customer={customer} />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={approve} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
              <span>✓ אשר ושמור</span>
            </button>
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
              <span>ביטול</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{props.label}</span>
      <input type="text" value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
    </label>
  );
}

function TextArea(props: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{props.label}</span>
      <textarea value={props.value} onChange={(e) => props.onChange(e.target.value)} rows={props.rows || 3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
    </label>
  );
}
