'use client';

// src/components/pricing/PricingEngineTab.tsx
// Standalone tab shell: sketch picker on top, PricingEngine below.
// Accepts a preselected sketch id (from the 🔧 button via ?sketch=).

import { useState } from 'react';
import PricingEngine, { type EngineSketch } from './PricingEngine';
import type { MaterialSettings } from '@/lib/offers/materialCalc';
import type { AlesCostSettings } from '@/lib/pricing/alesCostTypes';

export interface SketchOption {
  id: string;
  title: string;
  spec: Record<string, unknown> | null;
}

interface Props {
  sketches: SketchOption[];
  materialSettings: MaterialSettings;
  costSettings: AlesCostSettings;
  preselectId?: string;
}

export default function PricingEngineTab({ sketches, materialSettings, costSettings, preselectId }: Props) {
  const initial = preselectId && sketches.some((s) => s.id === preselectId) ? preselectId : (sketches[0]?.id || '');
  const [selectedId, setSelectedId] = useState(initial);

  const selected = sketches.find((s) => s.id === selectedId) || null;
  const engineSketch: EngineSketch | null = selected ? { id: selected.id, title: selected.title, spec: selected.spec } : null;

  return (
    <div dir="rtl" className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-lg p-3">
        <label className="text-xs text-stone-600 block mb-1">בחר שרטוט לתמחור</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
          {sketches.length === 0 && (<option value="">— אין שרטוטים שמורים —</option>)}
          {sketches.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
        </select>
      </div>

      <PricingEngine sketch={engineSketch} materialSettings={materialSettings} costSettings={costSettings} />
    </div>
  );
}
