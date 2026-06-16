'use client';

// src/components/demos/GalleryGrid.tsx
// Client filter tabs (all / demos / sketches) over the gallery grid.

import { useState } from 'react';
import DemoCard from './DemoCard';
import type { DemoTrial } from '@/lib/demos/demosData';

type Filter = 'all' | 'demo' | 'sketch';

export default function GalleryGrid({ demos }: { demos: DemoTrial[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const sketches = demos.filter((d) => d.kind === 'sketch');
  const renders = demos.filter((d) => d.kind !== 'sketch');
  const shown = filter === 'all' ? demos : filter === 'sketch' ? sketches : renders;

  const tab = (val: Filter, label: string, n: number) => (
    <button
      onClick={() => setFilter(val)}
      className={'px-3 py-1.5 rounded-md text-sm transition-colors ' + (filter === val ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
    >
      {label} <span className="opacity-70">({n})</span>
    </button>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4" dir="rtl">
        {tab('all', 'הכל', demos.length)}
        {tab('demo', '🎨 הדמיות', renders.length)}
        {tab('sketch', '📐 שרטוטים', sketches.length)}
      </div>
      {shown.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">אין פריטים בקטגוריה זו.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shown.map((d) => (<DemoCard key={d.id} demo={d} />))}
        </div>
      )}
    </div>
  );
}
