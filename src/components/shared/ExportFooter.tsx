/**
 * src/components/shared/ExportFooter.tsx
 *
 * Generic 5-button export action bar. Used by:
 *   - /intake analyzers (PhotoAnalyzer, Mp4Analyzer)
 *   - /sinc page call analysis display (Phase D)
 *   - any future analyzer/report page
 *
 * Per skill rule (memory #16): every API-driven report MUST include this component.
 * Per skill rule #13: <a> tags with Hebrew title attributes use single-line form
 * to avoid JSX parser confusion with bidi text.
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 */

'use client';

import { useState } from 'react';
import {
  buildGmailUrl,
  buildOutlookHandoffUrl,
  buildWhatsAppUrl,
  copyBodyForOutlook,
  openPrintWindow,
  type ReportSnapshot,
} from '@/lib/shared/exportFormats';

interface Props {
  snapshot:        ReportSnapshot;
  onProjectClick?: () => void;
}

type OutlookState = 'idle' | 'copying' | 'copied' | 'failed';

export default function ExportFooter({ snapshot, onProjectClick }: Props) {
  const [outlookState, setOutlookState] = useState<OutlookState>('idle');

  const gmailUrl    = buildGmailUrl(snapshot);
  const whatsAppUrl = buildWhatsAppUrl(snapshot);

  function handlePrint() {
    openPrintWindow(snapshot);
  }

  async function handleOutlook() {
    setOutlookState('copying');
    const ok = await copyBodyForOutlook(snapshot);

    if (!ok) {
      setOutlookState('failed');
      setTimeout(() => setOutlookState('idle'), 3000);
      return;
    }

    setOutlookState('copied');
    const url = buildOutlookHandoffUrl(snapshot);
    window.location.href = url;

    setTimeout(() => setOutlookState('idle'), 4000);
  }

  function handleProjectClick() {
    if (onProjectClick) {
      onProjectClick();
    } else {
      alert('דף לקוח/פרויקט יבוא בעדכון הבא. בינתיים אפשר לראות את הרשומה ב-Supabase.');
    }
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

  const customer   = snapshot.customer;
  const hasEmail   = customer && customer.email;
  const hasPhone   = customer && customer.phone;
  const gmailTitle = hasEmail ? 'Gmail אל ' + customer.email : 'פתיחת Gmail compose';
  const waTitle    = hasPhone ? 'WhatsApp אל ' + customer.phone : 'בחר מספר ב-WhatsApp';

  const linkClass = 'px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-50 no-underline';

  return (
    <div className="export-footer border-t border-gray-200 pt-3 mt-3" dir="rtl">
      <div className="text-xs text-gray-500 mb-2">פעולות מהירות:</div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handlePrint} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-50" title="פתיחת תצוגת הדפסה">
          <span>🖨️ הדפס</span>
        </button>

        <button type="button" onClick={handleOutlook} disabled={outlookState === 'copying'} className={outlookClass} title="העתקה לקליפבורד + פתיחת אאוטלוק. הדבק את הגוף ב-Ctrl+V">
          <span>{outlookEmoji} {outlookLabel}</span>
        </button>

        <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className={linkClass} title={gmailTitle}>
          <span>📧 Gmail</span>
        </a>

        <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className={linkClass} title={waTitle}>
          <span>💬 וואטסאפ</span>
        </a>

        <button type="button" onClick={handleProjectClick} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 rounded-md text-xs hover:bg-amber-50" title="דף לקוח/פרויקט">
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
