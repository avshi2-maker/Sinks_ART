'use client';

// src/components/quotes/QuoteView.tsx
// Phase 31 — single quote view: friendly⇄itemized toggle, copy, WhatsApp.

import { useState } from 'react';
import { normalizePhoneForWaMe } from '@/lib/shared/exportFormats';
import type { QuoteWithLines } from '@/lib/quotes/types';
import { QUOTE_STATUS_LABELS_HE } from '@/lib/quotes/types';

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }

export default function QuoteView({ quote }: { quote: QuoteWithLines }) {
  const [mode, setMode] = useState<'friendly' | 'itemized'>('friendly');

  const lines = quote.lines || [];
  const total = quote.total_grand || lines.reduce((s, l) => s + (Number(l.line_total) || 0), 0);

  function friendlyText(): string {
    return 'היי 🙂 הנה הצעת המחיר על הכיור שדיברנו — בערך ' + ils(total) + ' כולל הכל. אשמח לעשות לך אחד מדהים!';
  }

  function itemizedText(): string {
    const header = 'הצעת מחיר ' + quote.quote_number + (quote.customer_name_he ? ' · ' + quote.customer_name_he : '');
    const body = lines.map((l) => '• ' + l.description_he + ' — ' + ils(Number(l.line_total) || 0)).join('\n');
    return header + '\n\n' + body + '\n\nסה"כ: ' + ils(total);
  }

  const text = mode === 'friendly' ? friendlyText() : itemizedText();

  function copy() { navigator.clipboard.writeText(text); }
  function whatsapp() {
    const phone = normalizePhoneForWaMe(quote.customer_phone || '');
    const t = encodeURIComponent(text);
    window.open(phone ? 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + t : 'https://api.whatsapp.com/send?text=' + t, '_blank');
  }

  return (
    <div dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-stone-500">תצוגה:</span>
        <button onClick={() => setMode('friendly')} className={mode === 'friendly' ? 'text-xs px-3 py-1.5 rounded-md bg-stone-800 text-white' : 'text-xs px-3 py-1.5 rounded-md bg-stone-100 text-stone-700'}>סיכום ידידותי</button>
        <button onClick={() => setMode('itemized')} className={mode === 'itemized' ? 'text-xs px-3 py-1.5 rounded-md bg-stone-800 text-white' : 'text-xs px-3 py-1.5 rounded-md bg-stone-100 text-stone-700'}>מפורט לפי פריטים</button>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-md px-4 py-3 text-sm text-stone-800 whitespace-pre-wrap mb-3">{text}</div>

      {mode === 'itemized' && lines.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm mb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-right">
                <th className="py-2 px-3 font-medium">פריט</th>
                <th className="py-2 px-3 font-medium">כמות</th>
                <th className="py-2 px-3 font-medium">סכום</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-stone-100">
                  <td className="py-2 px-3 text-stone-800">{l.description_he}</td>
                  <td className="py-2 px-3 text-stone-600">{l.quantity} {l.unit || ''}</td>
                  <td className="py-2 px-3 text-stone-900 font-medium">{ils(Number(l.line_total) || 0)}</td>
                </tr>
              ))}
              <tr className="bg-stone-50">
                <td className="py-2 px-3 font-medium" colSpan={2}>סה"כ</td>
                <td className="py-2 px-3 font-bold text-stone-900">{ils(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={whatsapp} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">💬 שלח בוואטסאפ</button>
        <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200">📋 העתק</button>
      </div>
    </div>
  );
}
