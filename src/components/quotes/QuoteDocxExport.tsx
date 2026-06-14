'use client';

// src/components/quotes/QuoteDocxExport.tsx
// Button to download the quote as a Word draft for Ales.

export default function QuoteDocxExport({ quoteId, quoteNumber }: { quoteId: string; quoteNumber: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4" dir="rtl">
      <div className="text-sm font-semibold text-amber-800 mb-1">ייצוא טיוטה לאלס</div>
      <div className="text-xs text-amber-700 mb-3">קובץ Word לעריכה — אלס מוסיף לוגו ונייר מכתבים ושולח ללקוח ישירות.</div>
      <a href={`/api/quotes/${quoteId}/docx`} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 no-underline">
        <span>📄</span><span>הורד Word (טיוטה {quoteNumber})</span>
      </a>
    </div>
  );
}
