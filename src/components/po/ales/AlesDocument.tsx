'use client';

// src/components/po/ales/AlesDocument.tsx
// Container: stacks the 3 Ales pages (hero / sketch / cost) with print page-breaks.
// Reads the frozen snapshot; if a PO predates the pricing engine, shows a clean fallback.

import type { ProductionOrder } from '@/lib/po/poData';
import { readAlesSnapshot } from '@/lib/po/alesSnapshot';
import AlesHeroPage from './AlesHeroPage';
import AlesSketchPage from './AlesSketchPage';
import AlesCostPage from './AlesCostPage';

export default function AlesDocument({ po }: { po: ProductionOrder }) {
  const snap = readAlesSnapshot(po);
  const dateStr = po.issued_at
    ? new Date(po.issued_at).toLocaleDateString('he-IL')
    : new Date(po.created_at).toLocaleDateString('he-IL');

  if (!snap) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center" dir="rtl">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-800">
          הזמנה זו נוצרה לפני מנוע התמחור ואין בה נתוני עלות מלאים.<br />
          צור הוראת עבודה חדשה דרך <span className="font-medium">משרטוט להצעת מחיר</span> כדי לקבל את המסמך המלא.
        </div>
        <a href={'/po/' + po.id} className="inline-block mt-4 text-sm px-4 py-2 border border-stone-300 text-stone-600 rounded-md hover:bg-stone-50 no-underline">← להזמנה המלאה</a>
      </div>
    );
  }

  return (
    <div className="ales-doc bg-stone-100 min-h-screen py-4" dir="rtl">
      <style>{`
        .ales-page { margin: 0 auto 16px; max-width: 210mm; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-radius: 8px; }
        .no-print { }
        @media print {
          .ales-doc { background: white !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .ales-page { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; max-width: 100% !important; page-break-after: always; break-after: page; }
          .ales-page:last-child { page-break-after: auto; break-after: auto; }
        }
      `}</style>

      {/* action bar — hidden on print */}
      <div className="no-print max-w-xl mx-auto px-4 mb-3 flex gap-2">
        <button onClick={() => window.print()} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">🖨️ הדפס / שמור PDF</button>
        <a href={'/po/' + po.id} className="text-sm px-4 py-2 border border-stone-300 text-stone-600 rounded-md hover:bg-stone-50 no-underline">← להזמנה המלאה</a>
      </div>

      <AlesHeroPage po_number={po.po_number} dateStr={dateStr} snap={snap} />
      <AlesSketchPage snap={snap} />
      <AlesCostPage snap={snap} />
    </div>
  );
}
