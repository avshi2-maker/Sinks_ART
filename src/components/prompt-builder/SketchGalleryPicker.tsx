'use client';

// src/components/prompt-builder/SketchGalleryPicker.tsx
// Browse the saved-sketch gallery from inside the imaging builder and pick one into the סקיצה slot.

import { useState } from 'react';
import type { GallerySketchRow } from '@/lib/demos/demosData';

export interface SketchGalleryPickerProps {
  sketches: GallerySketchRow[];
  onPick: (sketch: GallerySketchRow) => void;
}

export default function SketchGalleryPicker({ sketches, onPick }: SketchGalleryPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const filtered = sketches.filter((s) => !query || (s.title_he || '').toLowerCase().includes(query));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        📐 בחר שרטוט מהגלריה
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={() => setOpen(false)}>
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-base font-semibold text-slate-800">גלריית שרטוטים — בחר לסקיצה</div>
              <button type="button" onClick={() => setOpen(false)} className="h-8 w-8 rounded-md text-lg text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם דגם…" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" dir="rtl" />
              <div className="mt-1 text-[11px] text-slate-500">{filtered.length} שרטוטים שמורים</div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">{sketches.length === 0 ? 'אין שרטוטים שמורים בגלריה עדיין.' : 'לא נמצאו שרטוטים לחיפוש זה.'}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filtered.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { onPick(s); setOpen(false); }}
                      className="group overflow-hidden rounded-lg border-2 border-slate-200 bg-white text-right hover:border-blue-400"
                      title={s.title_he || 'שרטוט'}
                    >
                      <div className="flex h-28 w-full items-center justify-center bg-white p-1" dangerouslySetInnerHTML={{ __html: s.sketch_svg }} />
                      <div className="border-t border-slate-100 px-2 py-1.5">
                        <div className="truncate text-xs font-medium text-slate-800">{s.title_he || 'שרטוט'}</div>
                        {(s.exteriorStoneUrl || s.interiorStoneUrl) && <div className="text-[10px] text-emerald-600">כולל דגימות שיש ✓</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
