'use client';

// src/components/po/AlesWorkOrder.tsx
// Simplified shop-floor work order for Ales — phone-viewable + printable.
// Reuses the existing ProductionOrder data (sketch_svg, spec). NO commercial fields,
// no costs, no change-orders — only build instructions. The full PO page stays intact.

import type { ProductionOrder } from '@/lib/po/poData';

interface Props { po: ProductionOrder; }

function specVal(spec: Record<string, unknown> | null, keys: string[]): string | null {
  if (!spec) return null;
  for (const k of keys) {
    const v = spec[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return null;
}

export default function AlesWorkOrder({ po }: Props) {
  const spec = po.sketch_spec;
  const title = specVal(spec, ['name', 'title', 'model_name', 'שם הדגם']) || po.ship_to_name || 'כיור';

  // Pull dimension-ish fields from the sketch spec if present (best-effort, RTL labels).
  const dims: Array<[string, string | null]> = [
    ['אורך', specVal(spec, ['lenCm', 'length', 'אורך'])],
    ['רוחב', specVal(spec, ['widCm', 'width', 'רוחב'])],
    ['גובה', specVal(spec, ['heightCm', 'height', 'גובה'])],
    ['עומק אגן', specVal(spec, ['basinDepthCm', 'basin_depth', 'עומק אגן'])],
    ['דופן קצה', specVal(spec, ['endWallCm', 'end_wall', 'דופן קצה'])],
    ['שיפוע', specVal(spec, ['slopePct', 'slope', 'שיפוע'])],
    ['ניקוז', specVal(spec, ['drain', 'ניקוז', 'drainRadius'])],
  ];
  const hasDims = dims.some(([, v]) => v);

  return (
    <div dir="rtl" className="ales-wo max-w-xl mx-auto px-4 py-5">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .ales-wo { max-width: 100% !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* header */}
      <div className="flex items-start justify-between border-b-2 border-stone-800 pb-3 mb-4">
        <div>
          <div className="text-lg font-bold text-stone-900">הוראת עבודה · Marble Art</div>
          <div className="text-sm text-stone-500">עבור: אלס · יצרן שיש</div>
        </div>
        <div className="text-left">
          <div className="text-xs text-stone-400">מס' הזמנה</div>
          <div className="text-base font-bold text-blue-700">{po.po_number}</div>
          <div className="text-xs text-stone-400">{po.issued_at ? new Date(po.issued_at).toLocaleDateString('he-IL') : new Date(po.created_at).toLocaleDateString('he-IL')}</div>
        </div>
      </div>

      {/* what to build */}
      <div className="mb-4">
        <div className="text-xs text-stone-400 mb-1">לביצוע</div>
        <div className="text-xl font-semibold text-stone-900">{title}</div>
      </div>

      {/* dimensions (if the sketch spec carries them) */}
      {hasDims && (
        <div className="mb-4 bg-stone-50 rounded-lg p-3">
          <div className="text-sm font-medium text-stone-700 mb-2">מידות</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {dims.filter(([, v]) => v).map(([label, v]) => (
              <div key={label} className="flex justify-between text-sm border-b border-stone-100 py-1">
                <span className="text-stone-500">{label}</span><span className="font-medium text-stone-800" dir="ltr">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* the sketch — the main thing Ales works from */}
      {po.sketch_svg ? (
        <div className="mb-4 border border-stone-200 rounded-lg overflow-hidden bg-white">
          <div className="text-sm font-medium text-stone-700 px-3 py-2 border-b border-stone-100">שרטוט ייצור</div>
          <div className="p-2" dangerouslySetInnerHTML={{ __html: po.sketch_svg }} />
        </div>
      ) : (
        <div className="mb-4 bg-amber-50 text-amber-800 text-sm rounded-lg px-3 py-2">אין שרטוט מצורף להזמנה זו.</div>
      )}

      {/* build instructions — plain */}
      <div className="mb-4">
        <div className="text-sm font-medium text-stone-700 mb-2">הוראות ביצוע</div>
        <ul className="text-sm text-stone-700 space-y-1.5 list-disc pr-5">
          <li>בניית גוף הכיור משני לוחות פורצלן 6 מ"מ בהדבקה (למינציה) = 12 מ"מ.</li>
          <li>חיתוך 45° בחיבורים להדבקה נקייה וחלקה (ללא תפר גלוי).</li>
          <li>שיפוע כפול לכיוון הניקוז המרכזי לפי השרטוט.</li>
          <li>גימור קצוות, חיבורים ופאות לפי התקן האומנותי.</li>
          <li>התקנה: כיור תלוי קיר על מערכת תלייה מתכתית ייעודית (עיגון כבד).</li>
        </ul>
      </div>

      {/* free remarks from the PO, if any */}
      {po.remarks_log && po.remarks_log.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-stone-700 mb-1">הערות</div>
          {po.remarks_log.map((r, i) => (
            <div key={i} className="text-sm text-stone-600">• {r.text}</div>
          ))}
        </div>
      )}

      {/* actions — hidden on print */}
      <div className="no-print flex gap-2 pt-3 border-t border-stone-200">
        <button onClick={() => window.print()} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">🖨️ הדפס / שמור PDF</button>
        <a href={`/po/${po.id}`} className="text-sm px-4 py-2 border border-stone-300 text-stone-600 rounded-md hover:bg-stone-50 no-underline">← להזמנה המלאה</a>
      </div>
    </div>
  );
}
