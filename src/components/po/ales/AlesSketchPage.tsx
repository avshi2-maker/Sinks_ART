'use client';

// src/components/po/ales/AlesSketchPage.tsx
// PAGE 2 — standalone print-ready production sketch. Black-on-white, own A4 page.
// Ales prints this and works from it at the bench.

import type { AlesWorkOrderSnapshot } from '@/lib/po/createWorkOrderFromSketch';

interface Props { snap: AlesWorkOrderSnapshot; }

export default function AlesSketchPage({ snap }: Props) {
  return (
    <section className="ales-page bg-white" dir="rtl">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="text-sm font-medium text-stone-700 mb-1">שרטוט ייצור · {snap.label}</div>
        <div className="text-xs text-stone-400 mb-4">מידות במ"מ · להדפסה ולעבודה בשטח</div>
        <div className="border border-stone-200 rounded-lg overflow-hidden bg-white" dangerouslySetInnerHTML={{ __html: snap.sketchSvg }} />
      </div>
    </section>
  );
}
