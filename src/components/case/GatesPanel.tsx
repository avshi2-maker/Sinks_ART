'use client';
// src/components/case/GatesPanel.tsx · updated 23.09.2026 10:35 (Asia/Jerusalem)
// The 10 publish gates, live.

import type { Gate } from '@/lib/case/gates';

export default function GatesPanel({ gates }: { gates: Gate[] }) {
  const ok = gates.filter((g) => g.pass).length;
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 flex flex-col gap-2">
      <div className="text-sm font-semibold text-stone-800">🚦 בדיקות לפני פרסום · {ok}/{gates.length}</div>
      <div className="grid sm:grid-cols-2 gap-1.5">
        {gates.map((g) => (
          <div key={g.id} className={'flex gap-2 items-start text-xs rounded px-2 py-1.5 ' + (g.pass ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>
            <span className="font-bold">{g.pass ? '✓' : '!'}</span>
            <span>{g.label}{!g.pass && g.hint ? ' — ' + g.hint : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
