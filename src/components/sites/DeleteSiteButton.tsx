'use client';

// src/components/sites/DeleteSiteButton.tsx
// Phase 34 — delete-site button with confirm, for the /sites list.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSite } from '@/lib/sites/deleteSite';

export default function DeleteSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('למחוק את האתר "' + siteName + '"? אנשי הקשר, המשימות והביקורים יימחקו. הפרויקטים יישארו (ינותקו מהאתר).')) return;
    setBusy(true);
    const res = await deleteSite(siteId);
    if (!res.ok) { setBusy(false); window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={busy} title="מחק אתר" className="text-stone-300 hover:text-red-600 disabled:opacity-40 text-sm">
      {busy ? '…' : '🗑️'}
    </button>
  );
}
