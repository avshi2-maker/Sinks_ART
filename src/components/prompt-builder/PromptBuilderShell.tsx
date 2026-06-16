// src/components/prompt-builder/PromptBuilderShell.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import GeometryFields from './GeometryFields';
import MediaInputPanel, { EMPTY_SELECTION } from './MediaInputPanel';
import type { MediaSelection } from './MediaInputPanel';
import PromptOutputCard from './PromptOutputCard';
import {
  buildNanoBananaPrompt,
  buildNanoBananaPitchPrompt,
  buildNanoBananaPitchFromBasePrompt,
  buildNanoBananaSlopeFromRimPrompt,
  buildKlingPrompt,
  buildKlingNegativePrompt,
  buildHiggsfieldPrompt,
  mapAnalyzedShape,
} from '@/lib/promptTemplates';
import type { PromptBuilderInputs } from '@/lib/promptTemplates';
import { savePromptsToAnalysis } from '@/lib/promptBuilderActions';
import { saveDemo } from '@/lib/demos/demosData';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/intake/cloudinary';
import ApiCostMeter from '@/components/shared/ApiCostMeter';
import ExportFooter from '@/components/shared/ExportFooter';
import { makeIdleReading, makeRunningReading, makeDoneReading, makeErrorReading } from '@/lib/sinc/apiMeter';
import type { ApiMeterReading } from '@/lib/sinc/types';
import type { ReportSnapshot } from '@/lib/shared/exportFormats';
import type { MediaAnalysis } from '@/lib/supabase';

interface PromptBuilderShellProps {
  mode: 'standalone' | 'per-customer';
  customerId?: string;
  mediaAnalyses?: MediaAnalysis[];
}

const DEFAULT_INPUTS: PromptBuilderInputs = {
  modelName: '',
  shape: 'rectangle',
  mount: 'countertop',
  dimensions: '',
  setting: '',
  faucetType: 'wall-tap',
  pitch: 'middle',
  drain: 'round',
  renderMode: 'accurate',
  mood: 'golden',
};

export default function PromptBuilderShell({ mode, customerId, mediaAnalyses }: PromptBuilderShellProps) {
  const router = useRouter();
  const [inputs, setInputs] = useState<PromptBuilderInputs>(DEFAULT_INPUTS);
  const [pitchMode, setPitchMode] = useState<'none' | 'rim' | 'base' | 'fromrim'>('none');
  const [selection, setSelection] = useState<MediaSelection>(EMPTY_SELECTION);
  const [meter, setMeter] = useState<ApiMeterReading>(makeIdleReading());
  const [analyzeNote, setAnalyzeNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDoubleSink = /double|כפול|2 אגנים|שני אגנים/i.test((inputs.modelName || '') + ' ' + (inputs.dimensions || ''));
  const nanoBananaPrompt = useMemo(() => (pitchMode === 'rim' ? buildNanoBananaPitchPrompt(inputs) : pitchMode === 'base' ? buildNanoBananaPitchFromBasePrompt(inputs) : pitchMode === 'fromrim' ? buildNanoBananaSlopeFromRimPrompt(inputs, isDoubleSink) : buildNanoBananaPrompt(inputs)), [inputs, pitchMode, isDoubleSink]);
  const klingPrompt = useMemo(() => buildKlingPrompt(inputs), [inputs]);
  const klingNegativePrompt = useMemo(() => buildKlingNegativePrompt(), []);
  const higgsfieldPrompt = useMemo(() => buildHiggsfieldPrompt(inputs), [inputs]);

  const sketchAnalysisId = selection.sketch?.analysisId;
  const canSave = mode === 'per-customer' && Boolean(sketchAnalysisId);
  const hasSketch = Boolean(selection.sketch);

  // Apply analyzed fields onto the form (shape mapped to our enum, dimensions verbatim).
  function fillFromAnalysis(shapeRaw?: string | null, dimsRaw?: string | null) {
    setInputs((prev) => ({
      ...prev,
      shape: shapeRaw ? mapAnalyzedShape(shapeRaw) : prev.shape,
      dimensions: dimsRaw ? dimsRaw : prev.dimensions,
    }));
  }

  // The sketch-first path. Per-customer rows already analyzed by /intake fill for free;
  // otherwise we run a live analysis (uploading the local file to Cloudinary first, since
  // the analyze route only accepts an HTTPS image URL).
  async function onAnalyzeSketch() {
    const sketch = selection.sketch;
    if (!sketch) return;
    setAnalyzeNote(null);

    // Path A: existing /intake analysis already on the row — free + instant.
    if (sketch.analysisId && mediaAnalyses) {
      const row = mediaAnalyses.find((r) => r.id === sketch.analysisId);
      if (row && (row.extracted_shape || row.extracted_dimensions)) {
        fillFromAnalysis(row.extracted_shape, row.extracted_dimensions);
        setAnalyzeNote('מולא מניתוח קיים של הסקיצה (ללא עלות).');
        return;
      }
    }

    // Path B: live analysis.
    const running = makeRunningReading('analyzing', 'ניתוח סקיצה · Claude');
    setMeter(running);
    try {
      let imageUrl = sketch.isObjectUrl ? '' : sketch.url; // per-customer cloudinary_url is HTTPS
      if (!imageUrl) {
        if (!sketch.file) {
          setMeter(makeErrorReading(running, 'אין קובץ סקיצה לניתוח'));
          return;
        }
        if (!isCloudinaryConfigured()) {
          setMeter(makeErrorReading(running, 'Cloudinary לא מוגדר ב-.env.local'));
          return;
        }
        const uploaded = await uploadToCloudinary(sketch.file);
        imageUrl = uploaded.url;
      }

      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageUrl, mediaType: 'sketch' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMeter(makeErrorReading(running, data.error || 'שגיאה בניתוח הסקיצה'));
        return;
      }

      const parsed = (data.parsed || {}) as Record<string, string | null>;
      fillFromAnalysis(parsed.extracted_shape, parsed.extracted_dimensions);
      const stone = parsed.extracted_stone_type ? ' · אבן: ' + parsed.extracted_stone_type : '';
      setAnalyzeNote('הסקיצה נותחה' + stone + '. בדקו ותקנו את השדות לפני יצירת הפרומפט.');
      setMeter(
        makeDoneReading(running, Number(data.inputTokens || 0), Number(data.outputTokens || 0), Number(data.apiCostUsd || 0)),
      );
    } catch (e) {
      setMeter(makeErrorReading(running, 'שגיאת רשת: ' + (e instanceof Error ? e.message : String(e))));
    }
  }

  const [savingDemo, setSavingDemo] = useState(false);
  const [demoSavedId, setDemoSavedId] = useState<string | null>(null);

  const onSaveAsDemo = async () => {
    setSavingDemo(true);
    setDemoSavedId(null);
    const moodLabel = inputs.renderMode === 'instagram' ? (' · ' + (inputs.mood || 'golden')) : '';
    const res = await saveDemo({
      title_he: (inputs.modelName.trim() || 'הדמיה') + moodLabel,
      nano_banana_prompt: nanoBananaPrompt,
      kling_prompt: klingPrompt,
      marble_family: inputs.setting.trim() || undefined,
      inputs_jsonb: inputs as unknown as Record<string, unknown>,
      customer_id: customerId || null,
    });
    setSavingDemo(false);
    if (res.ok && res.id) setDemoSavedId(res.id);
    else window.alert('שמירה נכשלה: ' + (res.error || ''));
  };

  const onSave = async () => {
    if (!sketchAnalysisId) return;
    setSaving(true);
    setSaveError(null);
    const result = await savePromptsToAnalysis(sketchAnalysisId, {
      nanoBananaPrompt,
      klingPrompt,
      klingNegativePrompt,
      inputs,
    });
    setSaving(false);
    if (result.ok) {
      setSavedVersion(result.version ?? null);
    } else {
      setSaveError(result.error || 'שמירה נכשלה');
    }
  };

  const onProjectClick = () => {
    if (!customerId) { router.push('/demos'); return; }
    if (customerId) router.push(`/customers/${customerId}`);
  };

  const snapshot: ReportSnapshot = {
    reportTypeHe: 'פרומפטים להדמיה',
    subjectSuffix: inputs.modelName || 'כיור מותאם',
    projectContext: inputs.setting || undefined,
    sections: [
      { headingHe: 'Nano Banana', bodyHe: nanoBananaPrompt },
      { headingHe: 'Kling', bodyHe: klingPrompt },
      { headingHe: 'Kling Negative', bodyHe: klingNegativePrompt },
    ],
    apiCostUsd: meter.costUsd,
  };

  return (
    <div dir="rtl" className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">בונה פרומפטים להדמיה</h1>
        <p className="text-sm text-slate-500">
          {mode === 'per-customer' ? 'מצב לקוח — טען מדיה קיימת ושמור פרומפטים אל הניתוח' : 'מצב עצמאי — לייצור תוכן מהיר ל-Instagram'}
        </p>
      </header>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <button type="button" onClick={() => setInputs((p) => ({ ...p, renderMode: 'accurate' }))} className={inputs.renderMode !== 'instagram' ? 'rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white' : 'rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200'}>📐 מדויק</button>
          <button type="button" onClick={() => setInputs((p) => ({ ...p, renderMode: 'instagram' }))} className={inputs.renderMode === 'instagram' ? 'rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white' : 'rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200'}>🔥 אינסטגרם</button>
          <button type="button" onClick={() => setPitchMode((v) => v === 'rim' ? 'none' : 'rim')} className={pitchMode === 'rim' ? 'rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white' : 'rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200'}>📐 שיפועים</button>
          <button type="button" onClick={() => setPitchMode((v) => v === 'base' ? 'none' : 'base')} className={pitchMode === 'base' ? 'rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white' : 'rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200'}>📐 שיפוע מבסיס</button>
          <button type="button" onClick={() => setPitchMode((v) => v === 'fromrim' ? 'none' : 'fromrim')} className={pitchMode === 'fromrim' ? 'rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white' : 'rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200'}>📐 שיפוע מהשפה</button>
          <span className="mr-2 text-xs text-slate-400">{inputs.renderMode === 'instagram' ? 'מצב הירו — דרמטי, עוצר גלילה' : 'מצב מדויק — נאמן לסקיצה'}</span>
        </div>
        {inputs.renderMode === 'instagram' ? (
          <div className="flex flex-wrap gap-2">
            {([['golden','☀️ שעת זהב'],['dark-spa','🌙 ספא כהה'],['gallery','💎 גלריה לבנה'],['penthouse','🏙️ פנטהאוז'],['organic','🌿 אורגני']] as [string,string][]).map(([key,label]) => (
              <button key={key} type="button" onClick={() => setInputs((p) => ({ ...p, mood: key as typeof p.mood }))} className={inputs.mood === key ? 'rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800 ring-2 ring-orange-400' : 'rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200'}>{label}</button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mb-6">
        <ApiCostMeter mode="single" status={meter} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <MediaInputPanel mode={mode} mediaAnalyses={mediaAnalyses} selection={selection} onChange={setSelection} />

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="mb-1 text-sm font-semibold text-slate-800">שלב 1 · נתחו את הסקיצה</div>
            <p className="mb-2 text-xs text-slate-500">ה-AI קורא את הסקיצה וממלא צורה ומידות. בדקו ותקנו לפני יצירת הפרומפט.</p>
            <button type="button" disabled={!hasSketch || meter.stage === 'analyzing'} onClick={onAnalyzeSketch} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
              {meter.stage === 'analyzing' ? 'מנתח…' : '🔍 מלא שדות מהסקיצה (AI)'}
            </button>
            {!hasSketch ? <p className="mt-2 text-xs text-slate-400">בחרו תחילה סקיצה למעלה.</p> : null}
            {analyzeNote ? <p className="mt-2 text-xs text-emerald-700">{analyzeNote}</p> : null}
          </div>

          <GeometryFields value={inputs} onChange={setInputs} />
        </section>

        <section>
          <PromptOutputCard nanoBananaPrompt={nanoBananaPrompt} klingPrompt={klingPrompt} klingNegativePrompt={klingNegativePrompt} mode={mode} canSave={canSave} saving={saving} savedVersion={savedVersion} onSave={onSave} />
          {inputs.renderMode === 'instagram' ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">🎬 Higgsfield — פרומפט לרילז (וידאו)</span>
                <button type="button" onClick={() => { navigator.clipboard.writeText(higgsfieldPrompt); window.alert('פרומפט Higgsfield הועתק'); }} className="text-xs px-3 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700">📋 העתק</button>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-slate-700 font-sans leading-relaxed">{higgsfieldPrompt}</pre>
              <p className="mt-2 text-xs text-amber-700">העלה את הרינדר מ-Nano Banana כתמונה, בחר את ה-Camera Move, הדבק את הסצנה. תנועה אחת בלבד · 5-8 שניות · 9:16.</p>
            </div>
          ) : null}
          {saveError ? <p className="mt-2 text-sm text-rose-600">{saveError}</p> : null}
          <div className="mt-4 rounded-xl border border-pink-200 bg-pink-50 p-3">
            <div className="mb-2 text-sm font-semibold text-slate-800">💾 שמור כהדמיה לגלריה</div>
            <p className="mb-2 text-xs text-slate-500">שומר את הפרומפט והגדרות בגלריית ההדמיות. אחר כך תוכל להעלות את הרינדר מ-Nano Banana אל אותה הדמיה.</p>
            {demoSavedId ? (
              <a href="/demos" className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">✓ נשמר — פתח גלריה ←</a>
            ) : (
              <button type="button" onClick={onSaveAsDemo} disabled={savingDemo} className="rounded-md bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{savingDemo ? 'שומר…' : '💾 שמור כהדמיה'}</button>
            )}
          </div>
        </section>
      </div>

      <div className="mt-8">
        <ExportFooter snapshot={snapshot} onProjectClick={onProjectClick} />
      </div>
    </div>
  );
}