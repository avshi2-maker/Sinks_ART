/**
 * AnalysisActionBar.tsx — v2.2 (Phase 15.5 fixes)
 * Phase 15.5 — Action Bar
 */

'use client';

import { useState } from 'react';
import {
  buildGmailUrl,
  buildOutlookHandoffUrl,
  buildWhatsAppUrl,
  copyAnalysisForOutlook,
  openPrintWindow,
} from '@/lib/intake/exportFormats';
import type { AnalysisResult } from '@/components/intake/analyzers/PhotoAnalyzer';
import type { CustomerWithProject } from '@/lib/supabase';

interface Props {
  result:    AnalysisResult;
  customer:  CustomerWithProject | null;
}

type OutlookState = 'idle' | 'copying' | 'copied' | 'failed';

export default function AnalysisActionBar({ result, customer }: Props) {
  const [outlookState, setOutlookState] = useState<OutlookState>('idle');

  const gmailUrl    = buildGmailUrl(result, customer);
  const whatsAppUrl = buildWhatsAppUrl(result, customer);

  function handlePrint() {
    openPrintWindow(result, customer);
  }

  async function handleOutlook() {
    setOutlookState('copying');
    const ok = await copyAnalysisForOutlook(result, customer);
    if (!ok) {
      setOutlookState('failed');
      setTimeout(() => setOutlookState('idle'), 3000);
      return;
    }
    setOutlookState('copied');
    const url = buildOutlookHandoffUrl(result, customer);
    window.location.href = url;
    setTimeout(() => setOutlookState('idle'), 4000);
  }

  function handleProjectClick() {
    alert('דף לקוח/פרויקט יבוא ב-Phase 16. בינתיים אפשר לראות את הרשומה ב-Supabase.');
  }

  let outlookLabel = 'לאאוטלוק';
  if (outlookState === 'copying') outlookLabel = 'מעתיק...';
  if (outlookState === 'copied')  outlookLabel = 'הועתק! Ctrl+V באאוטלוק';
  if (outlookState === 'failed')  outlookLabel = 'ההעתקה נכשלה';

  let outlookEmoji = '📋';
  if (outlookState === 'copying') outlookEmoji = '⏳';
  if (outlookState === 'copied')  outlookEmoji = '✓';
  if (outlookState === 'failed')  outlookEmoji = '⚠️';

  let outlookClass = 'px-3 py-1.5 border rounded-md text-xs flex items-center gap-1 ';
  if (outlookState === 'copied')      outlookClass += 'bg-green-50 border-green-300 text-green-700';
  else if (outlookState === 'failed') outlookClass += 'bg-red-50 border-red-300 text-red-700';
  else                                outlookClass += 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';

  const hasEmail = customer && customer.customer.email;
  const hasPhone = customer && customer.customer.phone;
  const gmailTitle = hasEmail ? 'Gmail אל ' + customer.customer.email : 'פתיחת Gmail compose';
  const waTitle    = hasPhone ? 'WhatsApp אל ' + customer.customer.phone : 'בחר מספר ב-WhatsApp';

  return (
    <div className="analysis-action-bar border-t border-gray-200 pt-3 mt-3" dir="rtl">
      <div className="text-xs text-gray-500 mb-2">פעולות מהירות:</div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handlePrint} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-50" title="פתיחת תצוגת הדפסה">
          <span>🖨️ הדפס</span>
        </button>
        <button type="button" onClick={handleOutlook} disabled={outlookState === 'copying'} className={outlookClass} title="העתקה לקליפבורד + פתיחת אאוטלוק. הדבק את הגוף ב-Ctrl+V">
          <span>{outlookEmoji} {outlookLabel}</span>
        </button>
        <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-50 no-underline" title={gmailTitle}>
          <span>📧 Gmail</span>
        </a>
        <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-50 no-underline" title={waTitle}>
          <span>💬 וואטסאפ</span>
        </a>
        <button type="button" onClick={handleProjectClick} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 rounded-md text-xs hover:bg-amber-50" title="דף לקוח/פרויקט יבוא ב-Phase 16">
          <span>🔗 פרויקט</span>
        </button>
      </div>
      {outlookState === 'copied' && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mt-2">
          ✓ הטקסט הועתק לקליפבורד. אאוטלוק נפתח עכשיו - הדבק את הגוף בלחיצה על Ctrl+V.
        </div>
      )}
      {!customer && (
        <div className="text-xs text-amber-600 mt-2">
          ⚠️ לא נבחר לקוח — נמען המייל / WhatsApp לא ימולא אוטומטית
        </div>
      )}
    </div>
  );
}
