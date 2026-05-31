// src/components/prompt-builder/PromptOutputCard.tsx
'use client';

import { useState } from 'react';

interface PromptOutputCardProps {
  nanoBananaPrompt: string;
  klingPrompt: string;
  klingNegativePrompt: string;
  mode: 'standalone' | 'per-customer';
  canSave: boolean;          // per-customer + a sketch analysisId is present
  saving: boolean;
  savedVersion: number | null;
  onSave: () => void;
}

interface PromptBlockProps {
  titleHe: string;
  hintHe?: string;
  text: string;
  rows: number;
}

function PromptBlock({ titleHe, hintHe, text, rows }: PromptBlockProps) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-800">{titleHe}</span>
          {hintHe ? <span className="mr-2 text-xs text-slate-400">{hintHe}</span> : null}
        </div>
        <button type="button" onClick={onCopy} className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700">
          {copied ? '✓ הועתק' : '📋 העתק'}
        </button>
      </div>
      <textarea readOnly dir="ltr" value={text} rows={rows} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-800" />
    </div>
  );
}

export default function PromptOutputCard({ nanoBananaPrompt, klingPrompt, klingNegativePrompt, mode, canSave, saving, savedVersion, onSave }: PromptOutputCardProps) {
  return (
    <div dir="rtl" className="space-y-3">
      <PromptBlock titleHe="פרומפט Nano Banana (תמונה סטטית)" text={nanoBananaPrompt} rows={12} />
      <PromptBlock titleHe="פרומפט Kling (תמונה לוידאו)" hintHe="קצר ~50-80 מילים" text={klingPrompt} rows={5} />
      <PromptBlock titleHe="Negative Prompt ל-Kling" hintHe="הדביקו בשדה הנפרד ב-Kling" text={klingNegativePrompt} rows={4} />

      {mode === 'per-customer' ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            {canSave ? 'יישמר אל שורת הניתוח של הסקיצה הנבחרת' : 'בחרו סקיצה ממדיית הלקוח כדי לאפשר שמירה'}
          </span>
          <button type="button" disabled={!canSave || saving} onClick={onSave} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'שומר…' : savedVersion ? `💾 נשמר (גרסה ${savedVersion})` : '💾 שמור אל הניתוח'}
          </button>
        </div>
      ) : null}
    </div>
  );
}