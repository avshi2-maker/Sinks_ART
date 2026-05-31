// src/components/prompt-builder/MediaInputPanel.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { MediaAnalysis } from '@/lib/supabase';

export type SlotKey = 'sketch' | 'sampleA' | 'sampleB';

export interface SelectedItem {
  url: string;            // object URL (standalone) OR cloudinary_url (per-customer)
  label: string;          // filename or short Hebrew label
  isObjectUrl: boolean;   // true => must be revoked when replaced/cleared
  analysisId?: string;    // present only for per-customer items (enables Save)
  file?: File;            // present only for standalone uploads (enables live analysis)
}

export interface MediaSelection {
  sketch: SelectedItem | null;
  sampleA: SelectedItem | null;
  sampleB: SelectedItem | null;
}

export const EMPTY_SELECTION: MediaSelection = { sketch: null, sampleA: null, sampleB: null };

interface MediaInputPanelProps {
  mode: 'standalone' | 'per-customer';
  mediaAnalyses?: MediaAnalysis[];
  selection: MediaSelection;
  onChange: (next: MediaSelection) => void;
}

const SLOT_LABELS: { key: SlotKey; he: string }[] = [
  { key: 'sketch', he: 'סקיצה' },
  { key: 'sampleA', he: 'דוגמת שיש A (חוץ)' },
  { key: 'sampleB', he: 'דוגמת שיש B (פנים האגן)' },
];

function revoke(item: SelectedItem | null) {
  if (item && item.isObjectUrl) {
    URL.revokeObjectURL(item.url);
  }
}

export default function MediaInputPanel({ mode, mediaAnalyses, selection, onChange }: MediaInputPanelProps) {
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // Revoke any held object URLs when the panel unmounts.
  useEffect(() => {
    return () => {
      revoke(selectionRef.current.sketch);
      revoke(selectionRef.current.sampleA);
      revoke(selectionRef.current.sampleB);
    };
  }, []);

  const assignFile = (key: SlotKey, file: File) => {
    revoke(selection[key]);
    const item: SelectedItem = { url: URL.createObjectURL(file), label: file.name, isObjectUrl: true, file };
    onChange({ ...selection, [key]: item });
  };

  const assignExisting = (key: SlotKey, row: MediaAnalysis) => {
    if (!row.cloudinary_url) return;
    revoke(selection[key]);
    const label = row.extracted_shape || row.media_type || 'מדיה';
    const item: SelectedItem = { url: row.cloudinary_url, label, isObjectUrl: false, analysisId: row.id };
    onChange({ ...selection, [key]: item });
  };

  const clearSlot = (key: SlotKey) => {
    revoke(selection[key]);
    onChange({ ...selection, [key]: null });
  };

  const rows = (mediaAnalyses || []).filter((r) => r.cloudinary_url);

  return (
    <div dir="rtl" className="space-y-4">
      {SLOT_LABELS.map(({ key, he }) => {
        const item = selection[key];
        const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) assignFile(key, file);
        };
        const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
        const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) assignFile(key, file);
        };
        return (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{he}</span>
              {item ? <button type="button" onClick={() => clearSlot(key)} className="text-xs text-rose-600 hover:underline">הסר</button> : null}
            </div>
            {item ? (
              <img src={item.url} alt={he} className="h-32 w-full rounded-lg object-cover" />
            ) : (
              <div onDrop={onDrop} onDragOver={onDragOver} className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-center text-xs text-slate-500">
                <span className="mb-2">גררו תמונה לכאן</span>
                <label className="cursor-pointer rounded-md bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-slate-200">
                  בחרו קובץ
                  <input type="file" accept="image/*" className="hidden" onChange={onPick} />
                </label>
              </div>
            )}
          </div>
        );
      })}

      {mode === 'per-customer' ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="mb-2 block text-sm font-semibold text-slate-700">מדיה קיימת של הלקוח</span>
          {rows.length === 0 ? (
            <p className="text-xs text-slate-500">אין עדיין מדיה ללקוח זה. השתמשו בטופס הקליטה, או עברו למצב עצמאי.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {rows.map((row) => {
                const assignSketch = () => assignExisting('sketch', row);
                const assignA = () => assignExisting('sampleA', row);
                const assignB = () => assignExisting('sampleB', row);
                return (
                  <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-1">
                    <img src={row.cloudinary_url as string} alt={row.media_type} className="h-20 w-full rounded object-cover" />
                    <div className="mt-1 flex justify-between text-[10px]">
                      <button type="button" onClick={assignSketch} className="rounded bg-slate-100 px-1 hover:bg-amber-100">סקיצה</button>
                      <button type="button" onClick={assignA} className="rounded bg-slate-100 px-1 hover:bg-amber-100">A</button>
                      <button type="button" onClick={assignB} className="rounded bg-slate-100 px-1 hover:bg-amber-100">B</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}