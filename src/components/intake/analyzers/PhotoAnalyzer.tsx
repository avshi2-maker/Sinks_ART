/**
 * PhotoAnalyzer.tsx
 *
 * The end-to-end photo/sketch analysis flow:
 *   1. Receives a File from MediaInput (parent passes it in)
 *   2. Uploads to Cloudinary (folder: marble-sinks/intake)
 *   3. POSTs the resulting URL to /api/analyze-photo
 *   4. Displays the Hebrew structured analysis with editable fields
 *   5. Reports the final analysis up to the parent for saving
 *
 * Sketches use the exact same flow as photos — only the prompt differs,
 * and that decision is made server-side based on the mediaType field.
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 04/05/2026
 */

'use client';

import { useState } from 'react';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/intake/cloudinary';

/** What this component reports to its parent when analysis is complete. */
export interface AnalysisResult {
  cloudinaryUrl:        string;
  sourceFilename:       string;
  mediaType:            'photo' | 'sketch';
  extractedDimensions:  string | null;
  extractedStoneType:   string | null;
  extractedShape:       string | null;
  designIntentHe:       string | null;
  referenceSummaryHe:   string | null;
  additionalNotesHe:    string | null;
  apiCostUsd:           number;
  rawJson:              Record<string, unknown> | null;
}

interface Props {
  file:      File;
  mediaType: 'photo' | 'sketch';
  onComplete: (result: AnalysisResult) => void;
  onCancel:   () => void;
}

type Stage = 'idle' | 'uploading' | 'analyzing' | 'review' | 'error';

interface AnalysisFields {
  extractedDimensions: string;
  extractedStoneType:  string;
  extractedShape:      string;
  designIntentHe:      string;
  referenceSummaryHe:  string;
  additionalNotesHe:   string;
}

export default function PhotoAnalyzer({ file, mediaType, onComplete, onCancel }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>('');
  const [apiCostUsd, setApiCostUsd] = useState<number>(0);
  const [rawJson, setRawJson] = useState<Record<string, unknown> | null>(null);
  const [fields, setFields] = useState<AnalysisFields>({
    extractedDimensions: '',
    extractedStoneType:  '',
    extractedShape:      '',
    designIntentHe:      '',
    referenceSummaryHe:  '',
    additionalNotesHe:   '',
  });

  async function startAnalysis() {
    setErrorMsg('');

    if (!isCloudinaryConfigured()) {
      setStage('error');
      setErrorMsg('Cloudinary לא מוגדר ב-.env.local');
      return;
    }

    // Stage 1: upload
    setStage('uploading');
    let uploaded;
    try {
      uploaded = await uploadToCloudinary(file);
    } catch (e) {
      setStage('error');
      setErrorMsg('שגיאת העלאה ל-Cloudinary: ' + (e instanceof Error ? e.message : String(e)));
      return;
    }
    setCloudinaryUrl(uploaded.url);

    // Stage 2: analyze
    setStage('analyzing');
    try {
      const res = await fetch('/api/analyze-photo', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ imageUrl: uploaded.url, mediaType }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStage('error');
        setErrorMsg(data.error || 'שגיאה בניתוח התמונה');
        return;
      }

      setApiCostUsd(data.apiCostUsd || 0);
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
    } catch (e) {
      setStage('error');
      setErrorMsg('שגיאת רשת: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  function approve() {
    onComplete({
      cloudinaryUrl,
      sourceFilename:      file.name,
      mediaType,
      extractedDimensions: fields.extractedDimensions || null,
      extractedStoneType:  fields.extractedStoneType  || null,
      extractedShape:      fields.extractedShape      || null,
      designIntentHe:      fields.designIntentHe      || null,
      referenceSummaryHe:  fields.referenceSummaryHe  || null,
      additionalNotesHe:   fields.additionalNotesHe   || null,
      apiCostUsd,
      rawJson,
    });
  }

  function updateField(key: keyof AnalysisFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="photo-analyzer space-y-4" dir="rtl">
      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
        <div className="font-medium text-gray-900">{file.name}</div>
        <div className="text-xs text-gray-500 mt-1">
          {(file.size / (1024 * 1024)).toFixed(2)} מ״ב · {mediaType === 'sketch' ? 'שרטוט' : 'תמונה'}
        </div>
      </div>

      {stage === 'idle' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            🪄 התחל ניתוח
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
          >
            ביטול
          </button>
        </div>
      )}

      {stage === 'uploading' && (
        <div className="text-sm text-gray-600 py-4">
          ⬆️ מעלה ל-Cloudinary...
        </div>
      )}

      {stage === 'analyzing' && (
        <div className="text-sm text-gray-600 py-4">
          🔍 Claude מנתח את ה{mediaType === 'sketch' ? 'שרטוט' : 'תמונה'}... (יכול לקחת 5-15 שניות)
        </div>
      )}

      {stage === 'error' && (
        <div className="space-y-2">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            ⚠️ {errorMsg}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage('idle')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              נסה שוב
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {stage === 'review' && (
        <div className="space-y-3">
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            ✓ ניתוח הושלם · עלות: ${apiCostUsd.toFixed(4)}
          </div>

          {/* Preview thumbnail */}
          {cloudinaryUrl && (
            <div className="border border-gray-200 rounded overflow-hidden bg-gray-50 inline-block max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cloudinaryUrl} alt="preview" className="block w-full" />
            </div>
          )}

          {/* Editable analysis fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="מידות"
              value={fields.extractedDimensions}
              onChange={(v) => updateField('extractedDimensions', v)}
              placeholder="לדוגמה: 60×40×15 ס״מ"
            />
            <Field
              label="סוג אבן"
              value={fields.extractedStoneType}
              onChange={(v) => updateField('extractedStoneType', v)}
              placeholder="לדוגמה: קרארה / ורדה אלפי"
            />
            <Field
              label="צורה"
              value={fields.extractedShape}
              onChange={(v) => updateField('extractedShape', v)}
              placeholder="אובלי / מלבני / חופשי"
            />
          </div>

          <TextArea
            label="כוונת העיצוב"
            value={fields.designIntentHe}
            onChange={(v) => updateField('designIntentHe', v)}
            rows={2}
          />
          <TextArea
            label="תיאור החומר המצורף"
            value={fields.referenceSummaryHe}
            onChange={(v) => updateField('referenceSummaryHe', v)}
            rows={2}
          />
          <TextArea
            label="הערות נוספות"
            value={fields.additionalNotesHe}
            onChange={(v) => updateField('additionalNotesHe', v)}
            rows={2}
          />

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={approve}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              ✓ אשר ושמור
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiny helpers (kept inside the same file because they're only used here) ──

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{props.label}</span>
      <input
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
      />
    </label>
  );
}

function TextArea(props: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{props.label}</span>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        rows={props.rows || 3}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />
    </label>
  );
}
