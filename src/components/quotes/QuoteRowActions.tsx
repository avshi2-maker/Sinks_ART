'use client';

// src/components/quotes/QuoteRowActions.tsx
// Per-quote action row for the /quotes report: ✏️ edit · 📦 archive / ♻️ restore · 🖨️ print · 💬 WhatsApp.
// Sits next to the existing 🗑️ delete button. Archive is reversible (status only, nothing deleted).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveQuote, unarchiveQuote } from '@/lib/quotes/archiveQuote';

interface Props {
  quoteId: string;
  quoteNumber: string;
  customerName: string | null;
  totalGrand: number;
  isArchived: boolean;
}

function ils(n: number): string { return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL'); }

export default function QuoteRowActions({ quoteId, quoteNumber, customerName, totalGrand, isArchived }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleArchive() {
    const msg = isArchived
      ? 'לשחזר את ההצעה ' + quoteNumber + ' מהארכיון?'
      : 'להעביר את ההצעה ' + quoteNumber + ' לארכיון? (ניתן לשחזר בכל רגע)';
    if (!window.confirm(msg)) return;
    setBusy(true);
    const res = isArchived ? await unarchiveQuote(quoteId) : await archiveQuote(quoteId);
    setBusy(false);
    if (!res.ok) { window.alert('הפעולה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  function openPrint() {
    window.open('/quotes/' + quoteId + '?print=1', '_blank');
  }

  function sendWhatsApp() {
    const txt = encodeURIComponent(
      'הצעת מחיר ' + quoteNumber +
      (customerName ? ' · ' + customerName : '') +
      '\nסה"כ: ' + ils(totalGrand) + ' (כולל מע"מ)'
    );
    window.open('https://api.whatsapp.com/send?text=' + txt, '_blank');
  }

  const btn = 'hover:text-blue-600 text-sm disabled:opacity-40';

  return (
    <span className="inline-flex items-center gap-2 text-stone-400">
      <button onClick={() => router.push('/quotes/' + quoteId)} title="פתח / ערוך" className={btn}>✏️</button>
      <button onClick={toggleArchive} disabled={busy} title={isArchived ? 'שחזר מארכיון' : 'העבר לארכיון'} className={btn}>{isArchived ? '♻️' : '📦'}</button>
      <button onClick={openPrint} title="הדפס" className={btn}>🖨️</button>
      <button onClick={sendWhatsApp} title="שלח בוואטסאפ" className="hover:text-green-600 text-sm">💬</button>
    </span>
  );
}
