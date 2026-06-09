'use client';

// src/components/quotes/DeleteQuoteButton.tsx
// Phase 33 — delete-quote button with confirm, for the /quotes list.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteQuote } from '@/lib/quotes/deleteQuote';

export default function DeleteQuoteButton({ quoteId, quoteNumber }: { quoteId: string; quoteNumber: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm('למחוק לצמיתות את הצעת המחיר ' + quoteNumber + '? הפעולה אינה הפיכה.')) return;
    setBusy(true);
    const res = await deleteQuote(quoteId);
    if (!res.ok) { setBusy(false); window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={busy} title="מחק הצעה" className="text-stone-300 hover:text-red-600 disabled:opacity-40">
      {busy ? '…' : '🗑️'}
    </button>
  );
}
